"""TTL LRU cache for expensive analysis endpoints."""

from __future__ import annotations

import time
from collections import OrderedDict
from typing import Any


class TTLCache:
    def __init__(self, maxsize: int = 128, ttl_seconds: float = 3600) -> None:
        self.maxsize = maxsize
        self.ttl_seconds = ttl_seconds
        self._store: OrderedDict[tuple, tuple[float, Any]] = OrderedDict()

    def get(self, key: tuple) -> Any | None:
        entry = self._store.get(key)
        if entry is None:
            return None
        expires_at, value = entry
        if time.time() > expires_at:
            del self._store[key]
            return None
        self._store.move_to_end(key)
        return value

    def set(self, key: tuple, value: Any) -> None:
        self._store[key] = (time.time() + self.ttl_seconds, value)
        self._store.move_to_end(key)
        while len(self._store) > self.maxsize:
            self._store.popitem(last=False)

    def clear(self) -> None:
        self._store.clear()
