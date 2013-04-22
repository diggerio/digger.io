var url = require('url');
var _ = require('lodash');

/*
 * Accepts a nested set of object literals and creates a single-level object
 * by combining the keys.
 *
 * flattenKeys({'a': {'b': function(){}, 'c': function(){}}})
 * {'ab': function(){}, 'ac': function(){}}
 *
 */
function flattenKeys(obj, /*optional args: */acc, prefix, prev_method){
    acc = acc || [];
    prefix = prefix || '';
    Object.keys(obj).forEach(function(k){
        var split = splitURL(k);
        if(typeof obj[k] == 'function') {
            acc.push([prefix + split.url, split.method || prev_method, obj[k]])
        }
        else {
            flattenKeys(obj[k], acc, prefix + split.url, split.method);
        }
    });
    return acc;
}

/*
 * Compiles the url patterns to a reqular expression, returning an array
 * of arrays.
 *
 * compileKeys([['abc', 'GET', function(){}], ['xyz', 'POST', function(){}]])
 * [[/^abc$/, 'GET', function(){}], [/^xyz$/, 'POST', function(){}]]
 */
function compileKeys(urls){
    return urls.map(function(url){
        // replace named params with regexp groups
        var paramfields = [];
        var pattern = url[0].replace(/\/:(\w+)/g, function(){
            paramfields.push(arguments[1]);
            return '(?:/([^\/]+))';
        });
        url[0] = new RegExp('^' + pattern + '$');
        url.push(paramfields);
        return url;
    });
}

/*
 * Break apart a url into the path matching regular expression and the
 * optional method prefix.
 */
function splitURL(url) {
    var method, path, match = /^([A-Za-z]+)(?:\s+|$)/.exec(url);
    if (match) {
        method = match[1];
        path = /^[A-Za-z]+\s+(.*)$/.exec(url);
        url = path ? path[1]: '';
    }
    return {url: url, method: method};
}

/*
 * The exported function for use as a Connect provider.
 * See test/test-dispatch.js for example usage.
 */
function compile_routes(urls){
    var compiled = compileKeys(flattenKeys(urls));
    return function(req, res, next){
        if(!compiled.some(function(x){

            var match = x[0].exec(url.parse(req.url).pathname);
            if (match) {
                if (!x[1] || x[1] === req.method) {
                    var paramfields = x[x.length-1];
                    var params = {};
                    _.each(match.slice(1), function(val, i){
                        params[paramfields[i]] = val;
                    })
                    req.params = params;
                    x[2].apply(null, [req, res, next].concat(params));
                    return true;
                }
            }
            return false;
        })) next();
    }
}

module.exports = function(){
    
    var routes = {};
    var compiled = false;
    var handle = function(req, res, next){
        next();
    }
    function compile(){
        if(compiled){
            return;
        }
        compiled = true;
        handle = compile_routes(routes);
    }

    var ret = function router(req, res, next){
        compile();
        handle(req, res, next);
    }

    ret.use = function(route, fn){
        if(!fn){
            fn = route;
            route = '/';
        }
        routes[route] = fn;
        return this;
    }

    var mapmethods = {
        'del':'delete'
    }

    _.each([
      'head',
      'get',
      'post',
      'put',
      'del'
    ], function(method){

      ret[method] = function(route, fn) {

        if(!fn){
          fn = route;
          route = '/';
        }

        route = (mapmethods[method] ? mapmethods[method] : method) + ' ' + route;

        return ret.use(route, fn);
      }

    })

    return ret;
}
