#!/usr/bin/env bash
touch /var/log/app.log
/etc/init.d/app start
tail -f /var/log/app.log
