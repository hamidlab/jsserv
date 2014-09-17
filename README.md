jsserv
======

Install `npm install jsserv -g`

Run `jsserv` in folder where your static website content present.

Demo

    index.jade
    ----------
    html
      head
        title Test Jsserv
        link(href='css/style.css', rel='stylesheet')
      body
        h1 Testing JSSERV
        script(src='js/script.js')


File Structure

    yourWebDir
      |_ index.jade
      |_ css/
      | |_ style.scss
      |_ js/
        |_ script.coffee

    ---------------------------------------
    cd into your site folder and run `jsserv`
    now goto/browse -- http://localhost:8765/

*That's it, you will be coding your static website like you used to code with html/css/javascript, except with `jsserv` you'll be enjoing benefits of css preprocessors, coffee script, jade etc without any taks runner or frameworks.*

How it works
------------

* when you request for `stylesheet.css`, `jsserv` will look for `stylesheet.css` or `stylesheet.scss` or `stylesheet.sass` or `stylesheet.less` or `stylesheet.styl`.
* when you request for `script.js`, `jsserv` will look for `script.js` or `script.coffee`.
* when you request for `page.html`, `jsserv` will look for `page.html` or `page.jade`.

