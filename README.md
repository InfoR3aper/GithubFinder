== Github Finder
GithubFinder is a fast and easy to browse through a Github repository.  Also, the files can quickly be diff-ed with one another to pin-point the changes.

This is a contest entry into the 10K Apart contest developing a meaningful app for the 10K Apart contest ().

== 10K App
==== Build
Since the app needs to be under 10,240 bytes, it needs special optimization to achieve this size.  The unminifed, uncompressed JS is about 30+ KB, all compressed down to 8.5KB or so.  

To build the app, run the provided ./build script to automatically bundle up everything into the ./app folder

==== App Bootstrap
The minified app is working as follow:

- bootstrap.js loads code from png and eval
- javascripts/app.js file is executed (this file is appended at the end of the files list)

== Credits
Github Finder is possible by leveraging these tools:

- string2png is inspired by NIHILOGIC.  http://blog.nihilogic.dk/2008/05/compression-using-canvas-and-png.html
- The javascript implementation of difflib by Snowtide.com.  http://snowtide.com/jsdifflib
- Dandean JSONP implementation for Prototype.  Code is patched to support onSuccess() event, and to also hook into Ajax.Responders live-cycle (useful for indicator).  http://github.com/dandean/Ajax.JSONRequest
- Github API.

== Self-plug
- I'm a single founder bootstrapping www.marrily.com, an online wedding planner.  Come check it out!  My blog is http://alexle.net