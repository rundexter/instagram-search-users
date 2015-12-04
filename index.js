var _ = require('lodash');
var ig = require('instagram-node').instagram();

var globalPickResult = {
    users: {
        fields: {
            username: 'username',
            first_name: 'first_name',
            last_name: 'last_name',
            profile_picture: 'profile_picture'
        }
    }

};

module.exports = {

   /**
     * Return pick result.
     *
     * @param output
     * @param pickTemplate
     * @returns {*}
     */
    pickResult: function (output, pickTemplate) {
        var result = {};
        // map template keys
        _.map(_.keys(pickTemplate), function (templateKey) {

            var oneTemplateObject = pickTemplate[templateKey];
            var outputKeyValue = _.get(output, templateKey);

            if (!outputKeyValue) {

                return result;
            }
            // if template key is object - transform, else just save
            if (_.isObject(oneTemplateObject)) {
                // if data is array - map and transform, else once transform
                if (_.isArray(outputKeyValue)) {

                    result = this._mapPickArrays(outputKeyValue, oneTemplateObject);
                } else {

                    result[oneTemplateObject.key] = this.pickResult(outputKeyValue, oneTemplateObject.fields);
                }
            } else {

                _.set(result, oneTemplateObject, outputKeyValue);
            }
        }, this);

        return result;
    },

    /**
     * System func for pickResult.
     *
     * @param mapValue
     * @param templateObject
     * @returns {*}
     * @private
     */
    _mapPickArrays: function (mapValue, templateObject) {

        var arrayResult = [],
            result = templateObject.key? {} : [];

        _.map(mapValue, function (inOutArrayValue) {

            arrayResult.push(this.pickResult(inOutArrayValue, templateObject.fields));
        }, this);

        if (templateObject.key) {

            result[templateObject.key] = arrayResult;
        } else {

            result = arrayResult;
        }

        return result;
    },

    /**
     * Set acess token.
     *
     * @param dexter
     * @param spotifyApi
     */
    authParams: function (dexter, spotifyApi) {

        if (dexter.environment('spotify_access_token')) {

            spotifyApi.setAccessToken(dexter.environment('spotify_access_token'));
        }
    },

    prepareStringInputs: function (inputs) {
        var result = {};

        _.map(inputs, function (inputValue, inputKey) {

            result[inputKey] = _(inputValue).toString();
        });

        return result;
    },

    /**
     * The main entry point for the Dexter module
     *
     * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
     * @param {AppData} dexter Container for all data used in this workflow.
     */
    run: function(step, dexter) {
        ig.use({ access_token: dexter.environment('instagram_access_token') });

        if (!step.input('q').first()) {

            this.fail('A [q] is Required for this module.');
        }

        ig.user_search(step.input('q').first(), this.prepareStringInputs(_.pick(step.inputs(), ['count'])), function (err, users) {

            if (err) {

                this.fail(err);
            } else {

                this.complete(this.pickResult({users: users}, globalPickResult));
            }
        }.bind(this));
    }
};
