#!/bin/bash
ifconfig | grep -o mon[0-9]* | head -n 1