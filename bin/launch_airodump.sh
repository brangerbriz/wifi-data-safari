#!/bin/bash
echo "launched"
airodump-ng --output-format csv --write data/airodump mon0
echo "done"