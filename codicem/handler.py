from send_morse_timings import send_morse_timings
from decode_morse import decode_morse


async def hello(websocket, path):
    while True:
        name = await websocket.recv()
        print("< {}".format(name))

        greeting = "Hello {}!".format(name)
        await websocket.send(greeting)
        print("> {}".format(greeting))


async def handler(websocket, path: str, args):
    if path == '/decode_morse':
        await decode_morse(websocket, path, args.model)
    elif path == '/hello':
        await hello(websocket, path)
    elif path == '/send_morse_timings':
        await send_morse_timings(websocket, '/home/braddock/expire/morse/2M-test')
    else:
        print("Unknown websocket path: ", path)