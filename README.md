#Sync.js

Web app for syncing external hdd connected to server

File moves with help of rsync )))

Api docs: [doc/api.md](./doc/api.md)

Deb layout:

    /usr/lib/syncjs         - app root dir and settings.json
    /usr/bin/syncjs         - link to /usr/lib/cli.js executable cli intrface
    /usr/sbin/syncjsd       - link to /usr/lib/webapp.js executeble server daemon
    /usr/share/syncjs       - public www client data
    /var/cache/syncjs       - cache for devices and so
    /var/run/syncjsd.pid    - pid file for daemon
    /etc/syncjs/config.json - main config file