# Changelog

## 1.6.0

- Add an inclusive console severity threshold through `new LoggerBundle({ level: LogLevel.ERROR })`.
- Add `LogLevel.DEBUG`, the default threshold, preserving output for every severity.
- Keep all log events available to custom listeners regardless of console settings.
- Fix console listener initialization and support rendering debug messages.
- Update development compiler and Node types so the package builds with current dependency resolutions.
