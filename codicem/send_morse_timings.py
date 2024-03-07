import asyncio
from timings_type import load_timings


async def send_morse_timings(websocket, filename):
    request = await websocket.recv()
    print("Sending timings for ", request)
    with open(filename, 'r') as f:
        while True:
            timings, text = load_timings(f)
            if timings is None:
                break
            for t in timings:
                print(t.to_json())
                await websocket.send(t.to_json())
            total_time = sum([t.duration for t in timings])
            await asyncio.sleep(total_time / 1000.0)
    print("Finished sending timings for ", filename)
