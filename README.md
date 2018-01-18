# WiFi Data Safari Workshop

WiFi Data Safari is a digital literacy workshop that aims to educate the public about the wireless network data that constantly surrounds them. Participants are lead through an urban environment spotting and collecting wireless signals from nearby personal devices as they travel. Using custom software, participants access personally identifiable data from strangers and perform targeted network attacks against volunteers, in an attempt to better understand the privacy concerns and exploitation tactics associated with WiFi. Throughout the workshop, we have conversations about information privacy and security, the shortcomings of the WiFi landscape, and the ways that companies, governments, and institutions collect and use personal wireless data.

The WiFi Data Safari Workshop is a continuation of the [Probe Kit project](http://probekit.brangerbriz.com/).
  
## The Workshop

For participants of the workshop, this document serves as a reference for the material that we cover during the workshop. For those of you who wandered here from the far reaches of the Internet, welcome. We hope that you will learn something while you are here, even if you couldn't make it to the workshop.

### The Inte rnet Landscape

The Internet is a complex network of networks linked together through industrial communications infrastructure. Many players are involved, from router and device manufacturers to Internet Service Provider (ISP), Tier 1 networks , Internet Exchange Points (IXP), trans-oceanic fiber optic cable, standards committees and consortium. Lots of machines talking to machines and people talking to people. Surprising to some, most of the Internet is connected by fiber optics and copper cable. It's usually only the last jump from your home router or a cell tower to your portable device that occurs over WiFi, a wireless radio frequency protocol that occupies the 2.4 GHz and 5 GHz frequency bands of electromagnetic spectrum. Its this protocol that we will be taking a look at particularly in this workshop. The 802.11 WiFi standard was introduced in 1997, before anyone had a phone that could connect to the Internet. As such, the specification was introduced without the security considerations and requirements that are necessary over twenty years later, when everyone walks around with a beaconing device on their person. 

### Probe Requests and Beacon Frames

Ever wonder how it is that your phone auto-connects to your home WiFi network automatically without you having to explicitly authenticate your device each time? This occurs through a series of network packet exchanges between your wireless device and your home router, or _access point_ (AP). Specifically, it leverages the use of two related 802.11 packet types, _probe requests_ sent from your device and _beacon frames_ sent from your access point. Probe requests are small packets of information that are emitted from wireless devices when they aren't connected to an access point. They include two useful pieces of information, 1) the SSID of the access point it has previously connected to and 2) the MAC address of the device probing. Many devices that have WiFi enabled, but aren't connected to a network, are constantly emitting probe requests in an attempt that their router will hear them and initialize an auto connection. That's useful if you happen to be returning home from work, but as we will see, its also dangerous and identifiable information that's openly projected from your device when you are out an about, nowhere near the router your device is attempting to connect to. In this way, WiFi devices are constantly advertising your personal network history wherever you go, leaving a fingerprint in the radio ether for others to pick up and use.  

Beacon frames serve a similar purpose to probe requests in that they exist to facilitate the authentication of devices to access points. Beacon frames contain the same useful bits of information as probes, only they are sent from access points that are advertising their existence to nearby devices. As soon as your phone sees a beacon frame emitted from the "My Home WiFi" access point, it will initialize a connection to the router. While this is helpful in the genuine case where your device auto connects to a known network, it also makes it trivial for an attacker to force a connection from your device to a malicious network by simply naming their network the same as your home network. This makes probe requests and beacon frames a lethal combination. One advertises the name of previously connected networks at all times, while the other can be used to auto connect devices knowing only the names of previously connected networks.

<!--
## References

## Running the Software Yourself


- Explain Internet landscape, wires vs wireless
- Maybe also a little infrastructure spotting here ( cell towers, manholes, etc. )
- Explain probes && beacons
	- Discuss basic info in the app 
- What’s a MAC address ( how that relates to vendor )
- How you might use timestamps ( is this someone around you? )
- What can you do with a collection of probes ( bssid’s )
- How it’s used to track in a location
- Explain Wigle/wardriving, discuss map
- Malicious honeypot (evil twin networks)
- Discuss protections 
- If haven’t already discuss MAC randomization (+short comings)
- Discuss turning WiFi off ( settings now in iOS )
- Discuss other possibilities ( Android app, +related geo approach )


Branger_Briz will lead participants on a tour through the city visualizing all the invisible Wifi data floating all around us via a custom built network application. Participants will access the custom app on their smart-phones and use it to scan and analyze the data in different parts of the city. Branger_Briz will lead participants through a series of discussions and Wifi hacking demonstrations as well as explanations on basic privacy measures and practices that can be taken to limit your wireless footprint in the wild. The data collected during the safari will be brought back to the gallery at the end of the workshop and added to the ProbeKit installation.

Probe Kit is an ongoing critical software art project that aims to educate the public about the
wireless network data that constantly surrounds them. Probe Kit captures 802.11 WiFi probe request
packets from passersby devices that are silently exposing personal information about the owner’s
previously connected WiFi networks and the physical locations where they may work, live, and play.
Through a metaphor of bug collection, we present the data collected as a wireless habitat, where
nearby WiFi devices appear as unique butterflies with “migration patterns” derived from publicly
accessible war driving data. By collecting and algorithmically organizing probe request data and then
cross referencing it with other datasets, we create a profile of each device in the area which
includes all the WiFi networks that device has ever connected to along with an interactive map
charting where these networks exist in physical space.
One of the most valuable currencies of our era is personal data, despite this fact, many of us don’t
really understand what it is, how it’s collected or exchanged and how it’s turned into wealth. Data
security is a low priority for much of the popular software and hardware we use today. As a result, it
isn’t difficult for institutions with the right tools to collect and leverage much of your personal
information.
In addition to the Probe Kit installation, we also lead a Wireless Data Safari workshop where
participants learn about wireless networks and collect network data themselves. The workshop
takes a small group on an outdoor walking tour. They are equipped with custom software that acts
as a navigation aid in exploring the wireless world around them. Throughout the safari, we discuss
how the WiFi protocol works and the hidden implications that come with a technology we all use

every day. At the end of the workshop, we gather together to review and analyze the data we have
captured and talk about steps that can be taken to hide or mask our wireless footprints.

-->