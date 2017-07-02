Prerequisites
=============
>
*   [nodejs](https://nodejs.org "nodejs")
*   [npm](https://github.com/npm/npm "npm")
*   [redis](https://redis.io "redis")

Install
=======
```bash
$ git clone https://github.com/seenkoo/node_chat.git \
  cd ./node_chat \
  npm install
```

Configuration
=============
Application can be configured by modifying [./config/default.yml](https://github.com/seenkoo/node_chat/blob/master/config/default.yml "Default config file") config file:

```yaml
# ./config/default.yml
workersCount: 4 # Number of subprocesses to run
historyTTL: 600 # Maximum message age in seconds

server:
  port: 8080 # Port to listen incoming requests
  host: 127.0.0.1 # Host to listen incoming requests

redis:
  host: 127.0.0.1 # IP address of the Redis server
  port: 6379 # Port of the Redis server
  path: null # The UNIX socket string of the Redis server
  url: null # The URL of the Redis server.
  db: 0 # Database index to use.
  password: null # If set, client will run AUTH command on connect
  keyPrefix: 'node_chat:' # The prefix to prepend to all keys in a command

logger:
  level: debug # ALL < TRACE < DEBUG < INFO < WARN < ERROR < FATAL < MARK < OFF
  category: '[node_chat]'
  stdout: false # Enable or disable logging to STDOUT
  file: # Setting this to falsy will disable logging to file
    filename: 'app.log' # Path of the file where you want your logs written
    maxLogSize: 10458760 # If not specified, then no log rolling will happen
    backups: 0 # Number of old log files to keep during log rolling
```

Start
=====
```bash
$ node app.js
```
