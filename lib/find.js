'use strict';

//dependencies
//import sails waterline Deferred
var Deferred = require('waterline/lib/waterline/query/deferred');
var WLValidationError = require('./WLValidationError');

/**
 * @description path sails `find()` method to allow
 *              custom error message definitions
 * @param  {Object} model          a valid sails model
 * @param  {Function} validateCustom a function to transform sails `invalidAttributes`
 *                                   to custome `Errors`
 */
module.exports = function (model, validateCustom) {
    //remember sails defined find
    //method
    //See https://github.com/balderdashy/waterline/blob/master/lib/waterline/query/finder/basic.js#L34
    var sailsFind = model.find;

    //prepare new find method
    function find(criteria, options, callback) {
        if (!criteria)criteria = {};
        // return Deferred
        // if no callback passed
        // See https://github.com/balderdashy/waterline/blob/master/lib/waterline/query/finder/basic.js#L34
        if (typeof callback !== 'function') {
            //this refer to the
            //model context
            return new Deferred(model, model.find, criteria, {});
        }

        if (model.definition.isDelete) {
            criteria.isDelete = false;
        }

        //otherwise
        //call sails find
        sailsFind
            .call(model, criteria, function (error, result) {
                //any findOrCreate error
                //found?
                if (error) {
                    //process sails invalidAttributes and
                    //attach Errors key in error object
                    //as a place to lookup for our
                    //custom errors messages
                    if (error.invalidAttributes) {
                        var customError =
                            validateCustom(model, error.invalidAttributes);

                        // will return and override with empty object when using associations
                        if (Object.keys(customError).length !== 0) {
                            error.Errors = customError;
                        }
                    }

                    if (callback) callback(WLValidationError.patch(error));
                } else {
                    //no error
                    //return
                    if (callback) callback(null, result);
                }
            });
    }

    //bind our new find
    //to our models
    model.find = find;
};
