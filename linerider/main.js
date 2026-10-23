// Runs linerider in js-dos's DOSBox, on this thread, with its General MIDI played from Windows'
// GM sound set (gm.dls) by synth.js, SpessaSynth with the voice rules of Windows' synth.
//
// DOSBox has no synth here: its OSS MIDI handler writes each byte as a 4-byte sequencer event
// (5, byte, device, 0) to the file midiconfig names, /dev/midi, which is a device made here that
// hands the bytes to the synth as they come.

const button = document.querySelector("button");
const canvas = document.querySelector("canvas");
const ctx2d = canvas.getContext("2d");
const image = ctx2d.createImageData(320, 200);

const fetchBytes = (url) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`${url}: ${r.status}`);
    return r.arrayBuffer();
  });

// The synth, before the click, so the intro starts on it at once. Windows' synth runs at
// 22,050 Hz
async function makeSynth(audio) {
  await audio.audioWorklet.addModule("synth.js");
  const node = new AudioWorkletNode(audio, "msgs", { numberOfInputs: 0, outputChannelCount: [2] });
  node.connect(audio.destination);
  const dls = await fetchBytes("gm.dls");
  await new Promise((resolve) => {
    node.port.onmessage = ({ data }) => data == "ready" && resolve();
    node.port.postMessage(dls, [dls]);
  });
  return node.port;
}

// MIDI messages from the stream of bytes; DOSBox sends whole messages, without running status
function midiParser(send) {
  let msg = [];
  let want = 0;
  return (byte) => {
    if (byte & 0x80) {
      if (byte >= 0xf8) return send([byte]);
      msg = [byte];
      want = byte == 0xf0 ? Infinity : (byte & 0xe0) == 0xc0 ? 2 : byte >= 0xf0 ? 1 : 3;
    } else if (msg.length) {
      msg.push(byte);
    }
    if (msg.length && (msg.length >= want || byte == 0xf7)) {
      send(msg);
      msg = [];
    }
  };
}

function drawRgb(rgb) {
  const d = image.data;
  for (let i = 0, j = 0; j < d.length; i += 3, j += 4) {
    d[j] = rgb[i];
    d[j + 1] = rgb[i + 1];
    d[j + 2] = rgb[i + 2];
    d[j + 3] = 255;
  }
  ctx2d.putImageData(image, 0, 0);
}

async function run(bundle, synth) {
  const midi = midiParser((msg) => synth.postMessage(msg));
  let event = [];
  const write = (byte) => {
    event.push(byte & 0xff);
    if (event.length < 4) return;
    if (event[0] == 5) midi(event[1]);
    event = [];
  };

  emulators.pathPrefix = "./";
  const dosbox = await (await emulators.wasmModules()).dosbox();
  const instantiate = dosbox.instantiate.bind(dosbox);
  let module;
  dosbox.instantiate = async (m) => {
    const result = await instantiate(m);
    m.FS.createDevice("/dev", "midi", null, write);
    module = m;
    return result;
  };

  const ci = await emulators.dosboxDirect(new Uint8Array(bundle));
  // DOSBox sleeps a millisecond whenever it's ahead of time, about 2,000 times a second.
  // js-dos waits those out by posting messages to the window until the time has come, which
  // keeps this thread busy all the time (it needs a tenth of it to emulate), wakes whatever else
  // listens to the window's messages, and leaves DOSBox behind, and catching up in bursts, at
  // every hitch. Here it waits on a timer, which browsers make 4 ms or so, and DOSBox runs those
  // milliseconds in one go; a yield without a time goes through a MessageChannel
  const channel = new MessageChannel();
  let pending = null;
  channel.port1.onmessage = () => {
    const wakeUp = pending;
    pending = null;
    if (module.alive) wakeUp();
  };
  const go = (wakeUp) => {
    pending = wakeUp;
    channel.port2.postMessage(0);
  };
  module.sync_sleep = (wakeUp) => {
    const wait = module.wakeUpAt === undefined ? 0 : module.wakeUpAt - Date.now();
    delete module.wakeUpAt;
    if (wait > 0) setTimeout(() => go(wakeUp), wait);
    else go(wakeUp);
  };
  ci.events().onFrame((rgb) => {
    if (ci.width() == 320 && ci.height() == 200) drawRgb(rgb);
  });
  window.linerider = { ci };
}

const audio = new AudioContext({ sampleRate: 22050 });
const ready = Promise.all([fetchBytes("linerider.jsdos"), makeSynth(audio)]);

async function start() {
  button.disabled = true;
  button.textContent = "loading…";
  const [bundle, synth] = await ready;
  await audio.resume();
  button.remove();
  await run(bundle, synth);
}

ready.then(
  () => {
    // Straight on when the browser lets the page play sound, after a click otherwise
    if (audio.state == "running") return start();
    button.disabled = false;
    button.textContent = "run ▶";
    button.focus();
    button.addEventListener("click", start, { once: true });
  },
  (e) => {
    button.textContent = `couldn't load: ${e.message}`;
    console.error(e);
  },
);
