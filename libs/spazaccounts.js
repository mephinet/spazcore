
/**
 * "constants" for account types 
 */
/**
 * @constant 
 */
var SPAZCORE_ACCOUNT_TWITTER	= 'twitter';
/**
 * @constant 
 */
var SPAZCORE_ACCOUNT_IDENTICA	= 'identi.ca';
/**
 * @constant 
 */
var SPAZCORE_ACCOUNT_STATUSNET	= 'StatusNet';
/**
 * @constant 
 */
var SPAZCORE_ACCOUNT_FLICKR		= 'flickr';
/**
 * @constant 
 */
var SPAZCORE_ACCOUNT_WORDPRESS	= 'wordpress.com';
/**
 * @constant 
 */
var SPAZCORE_ACCOUNT_WORDPRESS_TWITTER	= 'wordpress-twitter';
/**
 * @constant 
 */
var SPAZCORE_ACCOUNT_TUMBLR		= 'tumblr';
/**
 * @constant 
 */
var SPAZCORE_ACCOUNT_TUMBLR_TWITTER		= 'tumblr-twitter';
/**
 * @constant 
 */
var SPAZCORE_ACCOUNT_FACEBOOK	= 'facebook';
/**
 * @constant 
 */
var SPAZCORE_ACCOUNT_FRIENDFEED	= 'friendfeed';
/**
 * @constant 
 */
var SPAZCORE_ACCOUNT_CUSTOM 	= 'custom';

/**
 * This creates a new SpazAccounts object, and optionally associates it with an existing preferences object
 * @constructor
 * @param (Object) prefsObj  An existing SpazPrefs object (optional)
 */
var SpazAccounts = function(prefsObj) {
	if (prefsObj) {
		this.prefs = prefsObj;
	} else {
		this.prefs = new SpazPrefs();
		this.prefs.load();
	}
	
	/*
		load existing accounts
	*/
	this.load();

};

/**
 * the key used inside the prefs object 
 */
SpazAccounts.prototype.prefskey = 'users';

/**
 * loads the accounts array from the prefs object 
 */
SpazAccounts.prototype.load	= function() { 
	var accjson = this.prefs.get(this.prefskey);
	
	sch.debug("accjson:'"+accjson+"'");
	
	try {
		this._accounts = sch.deJSON(this.prefs.get(this.prefskey));
	} catch(e) {
		sch.error(e.message);
		this._accounts = [];
	}		

	/*
		sanity check
	*/
	if (!sch.isArray(this._accounts)) {
		this._accounts = [];
	}
	
	sch.debug("this._accounts:'"+this._accounts+"'");
	
};

/**
 * saves the accounts array to the prefs obj 
 */
SpazAccounts.prototype.save	= function() {
	this.prefs.set(this.prefskey, sch.enJSON(this._accounts));
	sch.debug('saved users to "'+this.prefskey+'" pref');
	for (var x in this._accounts) {
		sch.debug(this._accounts[x].id);
	};
	
	sch.debug('THE ACCOUNTS:');
	sch.debug(sch.enJSON(this._accounts));

	sch.debug('ALL PREFS:');
	sch.debug(sch.enJSON(this.prefs._prefs));

};

/**
 * returns the array of accounts
 * @returns {array} the accounts 
 */
SpazAccounts.prototype.getAll = function() {
	return this._accounts;
};

/**
 * Set all users by passing in a hash. overwrites all existing data!
 * @param {array} accounts_array an array of account objects
 */
SpazAccounts.prototype.setAll = function(accounts_array) {
	this._accounts = accounts_array;
	this.save();
	sch.debug("Saved these accounts:");
	for (var i=0; i < this._accounts.length; i++) {
		sch.debug(this._accounts[i].id);
	};
};

/**
 * @param {string} id the UUID to update
 * @param {object} acctobj
 * @param {string} [acctobj.username] a new username
 * @param {string} [acctobj.password] a new password
 * @param {string} [acctobj.type] a new account type
 * @param {object} [acctobj.meta] the hash of metadata; you should probably use SpazAccounts.setMeta() instead
 */
SpazAccounts.prototype.update = function(id, acctobj) {
	var orig = this.get(id);
	if (orig) {
		var modified = sch.defaults(orig, acctobj);
		return this.get(id);
	} else {
		sch.error('No account with id "'+id+'" exists');
		return null;
	}
};



/**
 * wipes the accounts array and saves it
 */
SpazAccounts.prototype.initAccounts	= function() {
	this._accounts = [];
	this.save();
};

/**
 * add a new account
 * @param {string} username the username of the account
 * @param {string} auth serialized authentication key, generated by SpazAuth.save()
 * @param {string} type the type of account
 * @returns {object} the account object just added
 */
SpazAccounts.prototype.add = function(username, auth, type) {
	
	if (!type) {
		sch.error("Type must be set");
		return false;
	}

	var account = {
		id: this.generateID(),
		type: type,
		auth: auth,
		username: username,
		meta: {}
	};

    this._accounts.push(account);
	this.save();

	return account;
};


/**
 * @param {string} id the UUID of the account to delete 
 */
SpazAccounts.prototype.remove = function(id) {
	sch.error("Deleting '"+id+"'…");
	
	var index = this._findUserIndex(id);
	if (index !== false) {
		var deleted = this._accounts.splice(index, 1);
		sch.debug("Deleted account '"+deleted[0].id+"'");
		this.save();
		return deleted[0];
	} else {
		sch.error("Could not find this id to delete: '"+id+"'");
		return false;
	}
};


/**
 * @param {string} type the type of accounts to retrieve
 * @returns {array} the array of matching accounts
 */
SpazAccounts.prototype.getByType = function(type) {
	var matches = [];
	
	for (var i=0; i < this._accounts.length; i++) {
		if (this._accounts[i].type === type) {
			matches.push(this._accounts[i]);
		}
	};
	
	return matches;
};

/**
 * @param {string} username the username to search for
 * @returns {array} an array of matching accounts
 */
SpazAccounts.prototype.getByUsername = function(username) {
	var matches = [];

	for (var i=0; i < this._accounts.length; i++) {
		if (this._accounts[i].username === username) {
			matches.push(this._accounts[i]);
		}
	};
	
	return matches;
};

/**
 * @param {string} username the username to search for
 * @param {string} type the type to search for
 * @returns {array} an array of matching accounts
 */
SpazAccounts.prototype.getByUsernameAndType = function(username, type) {
	var matches = [];

	for (var i=0; i < this._accounts.length; i++) {
		if (this._accounts[i].username === username && this._accounts[i].type === type) {
			matches.push(this._accounts[i]);
		}
	};
	
	return matches;
	
};


/**
 * retrives the user object by user and type
 * @param {string} id  the user id UUID
 * @param {string} type 
 */
SpazAccounts.prototype.get = function(id) {

	var index = this._findUserIndex(id);

	if (index !== false) {
		return this._accounts[i];		
	}
	
	return false;
	
};


SpazAccounts.prototype.getLabel = function(id) {
	
	var index = this._findUserIndex(id);
	var label = '';
	
	if (index !== false) {
		label = this._accounts[i].username+'@'+this._accounts[i].type;
		if (this._accounts[i].type === SPAZCORE_ACCOUNT_STATUSNET
			|| this._accounts[i].type === SPAZCORE_ACCOUNT_CUSTOM) {
			
		}
		return label;
	}

	return false;
	
};


/**
 * a private function to find the user's array index by their UUID
 * @param {string} id the user's UUID
 * @returns {number|boolen} returns the array index or false if DNE 
 */
SpazAccounts.prototype._findUserIndex = function(id) {
	
	for (i=0; i<this._accounts.length; i++) {
		
		if (this._accounts[i].id === id) {
			sch.debug('Found matching user record to '+ id);
			return i;
		}
		
	}
	
	return false;
};



/**
 * @returns {string} returns the generated UUID 
 */
SpazAccounts.prototype.generateID = function() {
	var id = sc.helpers.UUID();
	return id;
};



/**
 * @param {string} id the user's UUID
 * @param {string} key the key for the metadata entry
 * @returns {String|Object|Array|Boolean|Number} returns the set value, or null if user ID or meta entry is not found
 */
SpazAccounts.prototype.getMeta = function(id, key) {
	
	if ( (user = this.get(id)) ) {
		if (user.meta && user.meta[key] !== null ) {
			return user.meta[key];
		}
	}
	
	return null;
	
};

/**
 * @param {string} id the user's UUID
 * @param {string} key the key for the metadata entry
 * @param {String|Object|Array|Boolean|Number} value the value of the metadata entry
 * @returns {String|Object|Array|Boolean|Number} returns the set value, or null if user ID is not found
 */
SpazAccounts.prototype.setMeta = function(id, key, value) {
	
	var index = this._findUserIndex(id);

	if (index !== false) {		
		if (!this._accounts[index].meta) {
			this._accounts[index].meta = {};
		}
		this._accounts[index].meta[key] = value;
		
		this.save();
		
		return this._accounts[index].meta[key];
		
	}
	return null;
	
};