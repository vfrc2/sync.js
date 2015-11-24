#!/bin/bash

mount | grep "/media" | awk  '{ print $1,$3 }'