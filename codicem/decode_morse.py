from time import time
from . import morsenet
from .cwos.messages import RecogResults, pack_message, Recognition
from .timings_type import parse_timing


async def decode_morse(websocket, path, model_fname: str):
    print("Loading %s" % model_fname)
    net = morsenet.MorseNet()
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

        # Truncate long spaces
        timing.duration = min(timing.duration, 500.0)

        # Is this duration a continuation
        if (len(timings) > 0) and (timing.is_on == timings[-1].is_on):
            timings[-1].duration += timing.duration
            continuation = True
        else:
            timings.append(timing)
            continuation = False
        # Truncate the history
        timings = timings[-net.num_steps:]

        # Run the model to get the output for our timings
        t0 = time()
        y, y_space = net.predict([timings])
        # print("WPM: ", wpm)

        # print("TIMINGS:")
        # for i, t in enumerate(timings):
        #     print(i, t)
        print("RESUlT (%d ms): " % (int(1000 * (time() - t0))), y)

        # Send the output to the client
        if continuation:
            if last_output == y[0]:
                pass
            else:
                if last_output != '~' and last_output != '':
                    outputs = outputs[:-len(last_output)]
                if y[0] != '~':
                    outputs.append(Recognition(
                        label=y[0],
                        tid=timings[-1].tid,
                    ))
        else:
            if y[0] != '~':
                outputs.append(Recognition(
                    label=y[0],
                    tid=timings[-1].tid,
                ))
        outputs = outputs[-48:]
        last_output = y[0]

        norm_timings = net.normalize(timings)
        msg = RecogResults.from_dict({
            'recognitions': outputs,
            'normalized': norm_timings,
        })

        await websocket.send(pack_message(msg))
