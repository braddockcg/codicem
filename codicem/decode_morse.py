from json import dumps
from time import time
from . import morsenet
from .timings_type import parse_timing


async def decode_morse(websocket, path, model_fname: str):
    print("Loading %s" % model_fname)
    net = morsenet.MorseNet(use_cnn=True)
    net.load(model_fname)
    print("Loading Completed")

    timings = []
    outputs = []
    last_output = ''
    while True:
        timing_string = await websocket.recv()
        # print("< {}".format(timing_string))

        # Parse the timing string
        timing = parse_timing(timing_string)

        # Is this duration a continuation
        if (len(timings) > 0) and (timing.is_on == timings[-1].is_on):
            timings[-1].duration += timing.duration
            timings[-1].duration = min(timings[-1].duration, 300)
            continuation = True
        else:
            timings.append(timing)
            continuation = False
        # Truncate the history
        timings = timings[-48:]

        # Run the model to get the output for our timings
        t0 = time()
        y, wpm = net.predict([timings])
        # print("WPM: ", wpm)

        # print("TIMINGS:")
        # for i, t in enumerate(timings):
        #     print(i, t)
        # print("RESUlT (%d ms): " % (int(1000 * (time() - t0))), y)

        if continuation:
            if last_output == y[0]:
                pass
            else:
                if last_output != '~' and last_output != '':
                    outputs = outputs[:-len(last_output)]
                if y[0] != '~':
                    outputs.append({
                        'label': y[0],
                        'tid': timings[-1].tid,
                    })
        else:
            if y[0] != '~':
                outputs.append({
                    'label': y[0],
                    'tid': timings[-1].tid,
                })
        outputs = outputs[-48:]
        last_output = y[0]
        await websocket.send(dumps(outputs))
        # print("> {}".format(outputs))
