#!/bin/bash

mount | grep "$1" | awk  '{ print $1,$3 }'