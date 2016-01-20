var _ = require('lodash'),
    util = require('./util.js'),
    instagram = require('instagram-node').instagram();

var pickInputs = {
        'q': { key: 'q', validate: { req: true } },
        'count': { key: 'count', type: 'integer' }
    },
    pickOutputs = {
        username: { key: 'data', fields: ['username'] },
        full_name: { key: 'data', fields: ['full_name'] },
        profile_picture: { key: 'data', fields: ['profile_picture'] }
    };

module.exports = {
    /**
     * The main entry point for the Dexter module
     *
     * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
     * @param {AppData} dexter Container for all data used in this workflow.
     */
    run: function(step, dexter) {
        var credentials = dexter.provider('instagram').credentials(),
            inputs = util.pickInputs(step, pickInputs),
            validateErrors = util.checkValidateErrors(inputs, pickInputs);

        // check params.
        if (validateErrors)
            return this.fail(validateErrors);

        instagram.use({ access_token: _.get(credentials, 'access_token') });
        instagram.user_search(inputs.q, _.omit(inputs, 'q'), function (error, users) {

            error? this.fail(error) : this.complete(util.pickOutputs({ data: users }, pickOutputs));
        }.bind(this));
    }
};
