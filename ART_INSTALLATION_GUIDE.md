# Art Installation Guide

This document contains notes on how to install *WiFi Data Safari* as a permanent art installation on an Ubuntu 16.04 computer, running 24/7. The installation:

- Uses `brannondorsey/mitm-router:wifi-data-safari` docker image to create an ad-hoc WiFi nework that serves a wireless network named "WiFi Data Safari".
- Use a custom `dnsmasq.hosts` file (in `mitm-router:wifi-data-safari`) to resolve the domain name `wifi.safari` to `10.0.0.1`.
- Runs `wifi-data-safari/server.js` on port 80 (accessible at `10.0.0.1:80`) on system boot (using `/etc/rc.local`).
- Opens a fullscreen Electron application on boot (using Startup Applications which is required for apps that use X windows) that waits 20 seconds and redirects to `localhost:80/habitat` to show the 3D environment on the main display.

The installation functions correctly when you have 1 WiFi interface that supports monitor mode (used to both go into monitor mode to host the ad-hoc WiFi network with `mitm-router`) and 1 separate WiFi or Ethernet device that you can use to connect to the internet and share your connection with the WiFi device that is hosting the WiFi network.

**Note**: I've written this guide mostly from memory and consulted source code in the process, but I did not author this document while going through this process on a new Ubuntu install. For this reason, there may be an error somewhere in here (with logic, or more likely, with a BASH typo). Please forgive me if this is the case and create an issue if you are having trouble with these instructions.

## Downloading and installing

Prerequisites include `git`, `build-essential` (I think), Node.js (tested w/ v8.10 LTS and v6.12. Other versions may work) and Docker (community edition). The first two can be easily installed with Apt. Node can be installed via NVM (Node Version Manager) or the Node.js website (don't install via apt, they always have old versions). Docker should be installed following the instructions on Docker's website (they change somewhat frequently).

```bash
sudo apt-get update
sudo apt-get install git build-essential

# install Node.js v8.10 LTS
# ...

# install Docker CE
# ...
```

### `WiFi Data Safari`

#### Download

For the purposes of these notes, we assume all files are installed to `~/Desktop`, but you could install them in any location so long as the relative paths for `mitm-router/`, `wifi-data-safari/`, `electron/`, `start_installation.sh` are all siblings and the startup files point to the correct paths.

```bash
# clone the repo
cd ~/Desktop
git clone https://github.com/brangerbriz/wifi-data-safari

# install NPM dependencies
cd wifi-data-safari
npm install

# if you get any errors relating to sqlite, make sure sqlite3 is installed on your machine
# if not, install it, and run `npm rebuild` and/or `npm install` again
```

#### Run

Copy the following contents to a file called `run.sh` in the `wifi-data-safari` folder. You must make the necessary changes to this file, don't just blindly copy + paste...

```bash
#!/bin/bash

# CHANGE ME!
# replace this with your WiFi interface name
# you can use `ifconfig` to find this name
WIFI_IFACE=wlxc4e984d7a5d2

# CHANGE ME!
# use `which node` to get the absolute path to node
/absolute/path/to/node server \
--iface "$WIFI_IFACE" \
--port 80 \
--dns
```

```bash
# set execute permissions on run.sh
chmod +x run.sh
```

```bash
# note that sudo must be used when running this file because it is needed to
# create a mon0 monitor mode device from WIFI_IFACE  as well as to launch the
# node server on port 80
sudo ./run.sh
```

If all went well you should start to see network and station messages start to print to the console. Open a web browser and visit `localhost:80`, and `localhost:80/habitat` to make sure the installation is running correctly.

### Full-screen Electron application

Once the server is running it's accessible by any web browser on `http://localhost:80`, but a full-screen web browser isn't the nicest way to show an installation. Instead, we prefer to use an electron app that runs on boot. This electron app doesn't run the node server, it simply launches an HTML file that waits 20 seconds and then redirects to `http://localhost:80` using `window.location.href`.

A custom Ubuntu amd64 electron build with the appropriate HTML files to do this are available for download on our [releases page](https://github.com/brangerbriz/wifi-data-safari/releases/tag/data) here: https://github.com/brangerbriz/wifi-data-safari/releases/download/data/electron.zip

Download and unzip it to `~/Desktop`. Make sure you have the `node server.js` server running then open `~/Desktop/electron/electron`, wait 20 seconds. The the habitat view should now be full-screened.

## Creating a WiFi network with `mitm-router`

The `wifi-data-safari` branch of the [`brannondorsey/mitm-router`](https://github.com/brannondorsey/mitm-router) repository is used to launch a WiFi network named "WiFi Data Safari" from which users can connect to the *WiFi Data Safari* Node.js `server.js` running on port 80. Once the network is created, it will also resolve DNS queries for `wifi.safari` to `10.0.0.1:80` where this server is also accessible.

```bash
cd ~/Desktop
git clone https://github.com/brannondorsey/mitm-router

# pull and checkout the correct "wifi-data-safari" branch
cd mitm-router
git checkout -b wifi-data-safari
git pull origin wifi-data-safari
```

```bash
# build the docker container
docker build . -t brannondorsey/mitm-router:wifi-data-safari
```

Now create a new file called `run.sh` in the same `~/Desktop/mitm-router` folder. You must change the `AP_IFACE` value to be the name of the WiFi interface you are using with the wifi-data-safari `server.js --face XXX` server. `INTERNET_IFACE` should be a second WiFi or Ethernet device on your machine that has a real connection to the Internet.

```bash
#!/bin/bash

# CHANGE:
#    - AP_IFACE
#    - INTERNET_IFACE
docker run -it --net host --privileged \
-e AP_IFACE="wlxc4e984d7a5d2" \
-e INTERNET_IFACE="enp0s31f6" \
-e SSID="WiFi Data Safari" \
-e MAC="unchanged" \
-v "$(pwd)/data:/root/data" \
--detach \
--rm \
brannondorsey/mitm-router:wifi-data-safari
```

Once you've created `run.sh` and edited the two ENV variables above, change the file permissions to add execution privileges.

```bash
chmod +x run.sh
```

Run `./run.sh` to launch the docker container and spawn the "WiFi Data Safari" WiFi network. Connect to this network on your phone or computer and visit `http://wifi.safari` to make sure that everything is working correctly.

## Running everything on boot

This is useful when you would like to configure everything to run automagically when you turn the machine on (even without a mouse and keyboard plugged in). This is a useful provision for gallery staff, etc.

**Note**: Only continue with this step once you have completed everything else on this page ^ and tested that it is working correctly. There are, unfortunately, a lot of moving parts that have to all be working correctly for auto-launch to work.

### Auto-launch Node.js server and WiFi AP docker container

Begin by creating a new file called `~/Desktop/start_installation.sh` and saving the following contents to that file:

```bash
#!/bin/bash

# Launch and installation and its subprocesses. If the subprocesses
# go down, re-launch them individually. If this script receives a
# shutdown signal (Ctrl-c, etc...), kill the child processes.

function on_exit() {
	kill $NODE_PID
	docker stop "$DOCKER_CONTAINER_ID"
	exit 0
}

function start_node_server() {
	cd wifi-data-safari
	./run.sh &
	NODE_PID=$!
	cd -
}

function start_docker_container() {
	cd mitm-router
	DOCKER_CONTAINER_ID="$(./run.sh)"
	cd -
}

# fire on_exit when these signals are caught
trap on_exit INT TERM EXIT

start_node_server
start_docker_container

while true ; do

	if ! $(kill -0 "$NODE_PID" > /dev/null 2>&1) ; then
		echo "the frontend quit, re-launching"
		start_node_server
	fi

	sleep 1

done
```

```bash
# give the new file execute privileges
chmod +x ~/Desktop/start_installation.sh
```

This file, when run with `sudo` privileges, will launch both the `wifi-data-safari/server.js` Node server and create and run a new `mitm-router` docker container using both project's corresponding `run.sh` files you created earlier. It will also re-launch the Node server if it crashes. This `start_installation.sh` script can be run with root privileges by adding the following line to your `/etc/rc.local` file with `sudo nano /etc/rc.local`:

```bash
# NOTE you MUST replace the two instances of /home/leaf below with the path to
# YOUR user's home folder
sleep 10 && cd /home/leaf/Desktop && ./start_installation.sh # 2>&1 > /home/leaf/Desktop/installation.log &
```

Don't forget to replace `/home/leaf` with `/home/YOUR_USER`. If nothing else was in your `/etc/rc.local` file before, it should now look like this (if there was something there, adding the above line shouldn't cause a problem).

```bash
#!/bin/sh -e
#
# rc.local
#
# This script is executed at the end of each multiuser runlevel.
# Make sure that the script will "exit 0" on success or any other
# value on error.
#
# In order to enable or disable this script just change the execution
# bits.
#
# By default this script does nothing.

# if you try this out, and it doesn't work the first time, uncomment the second
# half of the to log stderr and stdout to ~/Desktop/installation.log and see
# what's up
sleep 10 && cd /home/leaf/Desktop && ./start_installation.sh # 2>&1 > /home/leaf/Desktop/installation.log &

exit 0
```

### Auto-launch the Electron app in full-screen

The last step is to configure the electron app you downloaded earlier from the release pages to run on boot. This can be done easily using "Startup Applications." Open the spotlight and type in "Startup Applications", then press enter. Click "Add". Fill in the form's name input field "Wifi Data Safari Electron" (or whatever you want to call this startup item). Now select the "Browse" button on the "Command" input field and use the file dialogue to select the electron binary located at `~/Desktop/electron/electron`. Click "Save", and that's it!

Reboot your machine and cross your fingers. If everything worked the installation should launch (after 20-30 seconds) and the "WiFi Data Safari" WiFi network should be available.
