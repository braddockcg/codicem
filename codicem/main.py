import sys
import argparse
import asyncio
import websockets

from handler import handler


def main():
    parser = argparse.ArgumentParser(description='Morse Code Environment')
    parser.add_argument('--port', type=int, default=8765, help='Port to listen on')
    parser.add_argument('--interface', type=str, default='localhost', help='Interface to listen on')
    parser.add_argument('--model', type=str, default='2M.keras', help='Model file')
    args = parser.parse_args()
    print("Port: ", args.port)

    start_server = websockets.serve(
        lambda ws, path: handler(ws, path, args),
        args.interface,
        args.port
    )

    print("Starting server...")
    asyncio.get_event_loop().run_until_complete(start_server)
    asyncio.get_event_loop().run_forever()

if __name__ == "__main__":
    main()
