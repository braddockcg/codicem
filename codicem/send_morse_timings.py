import asyncio
from json import dumps, loads
from .timings_type import load_timings, scale_timings


async def send_morse_timings(websocket, filename):
    with open(filename, 'r') as f:
        while True:
            request = await websocket.recv()
            req = loads(request)
            print("Sending timings for ", request)
            timings, text = load_timings(f)
            if timings is None:
                timings = []
            timings = scale_timings(timings, req['wpm'])
            obj = [t.to_dict() for t in timings]
            await websocket.send(dumps(obj))
            # total_time = sum([t.duration for t in timings])
            # await asyncio.sleep(total_time / 1000.0)
    print("Finished sending timings for ", filename)
