'use strict'
var events = require('events');
var Q = require('q');
var urljoin = require('url-join');
var RequestModel = require('./RequestModel');

class FeedModel extends RequestModel
{
	constructor (agentBaseUrl, certOptions, headers)
	{
		super(certOptions, headers);

		this.agentBaseUrl = agentBaseUrl;
		this.baseTime = Date.now();
	}

	start ()
	{
		return this.create()
			.then(function(id)
			{
				this.feedId = id;
				this.run(id);
			}.bind(this));
	}

	stop ()
	{
		this.stopped = true;
	}

	run (id)
	{
		return this.request(urljoin(this.agentBaseUrl, '/v4/datafeed/', id,  '/read'), 'GET')
			.then(function(response)
			{
				if (this.stopped) return;

				try {
					this.emit('messages', response);
				} catch(e) {
					console.warn(e.stack);
				}

				return this.run(id);
			}.bind(this))
			.fail(function(reason)
			{
				this.emit('error', reason);

				return this.run(id);
			}.bind(this));
	}

	create ()
	{
		return this.request(urljoin(this.agentBaseUrl, '/v4/datafeed/create'), 'POST')
			.then(function(response)
			{
				return response.id;
			}.bind(this));
	}
}

module.exports = FeedModel;
