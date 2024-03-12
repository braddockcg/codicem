from random import randint
from dataclasses import dataclass
from typing import Dict, Any, List

from dataclasses_json import dataclass_json

from codicem.timings_type import Timing

next_message_id = randint(0, 1000000)


def get_message_id():
    global next_message_id
    next_message_id += 1
    return next_message_id


@dataclass_json
@dataclass(kw_only=True)
class Message:
    mid: int = get_message_id()
    message_type: str = "Message"

    def __post_init__(self):
        self.message_type = self.__class__.__name__


@dataclass_json
@dataclass(kw_only=True)
class TimingsMessage(Message):
    timings: List[Timing]


@dataclass_json
@dataclass(kw_only=True)
class Recognition:
    tid: int
    label: str


@dataclass_json
@dataclass(kw_only=True)
class RecogResults(Message):
    recognitions: List[Recognition]
    normalized: List[Timing]


@dataclass_json
@dataclass(kw_only=True)
class Envelope:
    message_type: str
    payload: Dict[str, Any]


def unpack_message(msg: str):
    """Parse a message from a string and return a Message object."""
    envelope = Envelope.from_json(msg)
    if envelope.message_type == TimingsMessage.__name__:
        return TimingsMessage.from_dict(envelope.payload)
    else:
        raise ValueError("Unknown message type: " + envelope.message_type)


def pack_message(msg: Message):
    """Pack a Message object into a string."""
    return Envelope(
        message_type=msg.message_type,
        payload=msg.to_dict()
    ).to_json()
