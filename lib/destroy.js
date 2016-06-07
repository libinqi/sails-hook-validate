/**
 * Created by libinqi on 2016/6/7.
 */
'use strict';

//dependencies
//import sails waterline Deferred
var Deferred = require('waterline/lib/waterline/query/deferred');
var WLValidationError = require('./WLValidationError');

/**
 * @description path sails `update()` method to allow
 *              custom error message definitions
 * @param  {Object} model          a valid sails model
 * @param  {Function} validateCustom a function to transform sails `invalidAttributes`
 *                                   to custome `Errors`
 */
module.exports = function (model, validateCustom) {
    //remember sails defined update
    //method
    //See https://github.com/balderdashy/waterline/blob/master/lib/waterline/query/dql/destroy.js
    var sailsDestroy = model.destroy;

    //prepare new update method
    //which wrap sailsDestroy
    //with custom error message checking
    function destroy(criterias, callback) {

        // return Deferred
        // if no callback passed
        // See https://github.com/balderdashy/waterline/blob/master/lib/waterline/query/dql/destroy.js
        if (typeof callback !== 'function') {
            //this refer to the
            //model context
            return new Deferred(model, model.destroy, criterias);
        }

        if (model.definition.isDelete) {
            model.update.call(model, criterias, {isDelete: true}, function (error, result) {
                //any update error
                //found?
                if (error) {
                    //process sails invalidAttributes and
                    //attach Errors key in error object
                    //as a place to lookup for our
                    //custom errors messages
                    if (error.invalidAttributes) {
                        var customError =
                            validateCustom(model, error.invalidAttributes);

                        // will return and override with empty object
                        // when using associations
                        if (Object.keys(customError).length !== 0) {
                            error.Errors = customError;
                        }
                    }

                    callback(WLValidationError.patch(error));
                } else {
                    //no error
                    //return
                    callback(null, result);
                }
            });
        }
        else {
            //otherwise
            //call sails update
            sailsDestroy
                .call(model, criterias, function (error, result) {
                    //any update error
                    //found?
                    if (error) {
                        //process sails invalidAttributes and
                        //attach Errors key in error object
                        //as a place to lookup for our
                        //custom errors messages
                        if (error.invalidAttributes) {
                            var customError =
                                validateCustom(model, error.invalidAttributes);

                            // will return and override with empty object
                            // when using associations
                            if (Object.keys(customError).length !== 0) {
                                error.Errors = customError;
                            }
                        }

                        callback(WLValidationError.patch(error));
                    } else {
                        //no error
                        //return
                        callback(null, result);
                    }
                });
        }

    }

    //bind our new update
    //to our models
    model.destroy = destroy;
};
