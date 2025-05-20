Uncaught runtime errors:
×
ERROR
Failed to execute 'animate' on 'Element': 'cubic-bezier(0.6, 0.05, -0.01, 0.9)' is not a valid value for easing
TypeError: 'cubic-bezier(0.6, 0.05, -0.01, 0.9)' is not a valid value for easing
    at startWaapiAnimation (http://localhost:3001/static/js/bundle.js:106529:29)
    at new NativeAnimation (http://localhost:3001/static/js/bundle.js:104695:107)
    at new NativeAnimationExtended (http://localhost:3001/static/js/bundle.js:104874:5)
    at AsyncMotionValueAnimation.onKeyframesResolved (http://localhost:3001/static/js/bundle.js:104176:140)
    at DOMKeyframesResolver.onComplete (http://localhost:3001/static/js/bundle.js:104126:114)
    at DOMKeyframesResolver.complete (http://localhost:3001/static/js/bundle.js:105858:10)
    at http://localhost:3001/static/js/bundle.js:105771:42
    at Set.forEach (<anonymous>)
    at measureAllKeyframes (http://localhost:3001/static/js/bundle.js:105771:13)
    at triggerCallback (http://localhost:3001/static/js/bundle.js:106899:5)