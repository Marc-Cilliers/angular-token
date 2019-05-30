/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { Injectable, Optional, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { isPlatformServer } from '@angular/common';
import { fromEvent, interval, BehaviorSubject } from 'rxjs';
import { pluck, filter, share, finalize } from 'rxjs/operators';
import { ANGULAR_TOKEN_OPTIONS } from './angular-token.token';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common/http";
import * as i2 from "./angular-token.token";
import * as i3 from "@angular/router";
var AngularTokenService = /** @class */ (function () {
    function AngularTokenService(http, config, platformId, activatedRoute, router) {
        this.http = http;
        this.platformId = platformId;
        this.activatedRoute = activatedRoute;
        this.router = router;
        this.userType = new BehaviorSubject(null);
        this.authData = new BehaviorSubject(null);
        this.userData = new BehaviorSubject(null);
        this.localStorage = {};
        this.global = (typeof window !== 'undefined') ? window : {};
        if (isPlatformServer(this.platformId)) {
            // Bad pratice, needs fixing
            this.global = {
                open: function () { return null; },
                location: {
                    href: '/',
                    origin: '/'
                }
            };
            // Bad pratice, needs fixing
            this.localStorage.setItem = function () { return null; };
            this.localStorage.getItem = function () { return null; };
            this.localStorage.removeItem = function () { return null; };
        }
        else {
            this.localStorage = localStorage;
        }
        /** @type {?} */
        var defaultOptions = {
            apiPath: null,
            apiBase: null,
            signInPath: 'auth/sign_in',
            signInRedirect: null,
            signInStoredUrlStorageKey: null,
            signOutPath: 'auth/sign_out',
            validateTokenPath: 'auth/validate_token',
            signOutFailedValidate: false,
            registerAccountPath: 'auth',
            deleteAccountPath: 'auth',
            registerAccountCallback: this.global.location.href,
            updatePasswordPath: 'auth',
            changePasswordPath: 'auth/password',
            resetPasswordPath: 'auth/password',
            resetPasswordCallback: this.global.location.href,
            userTypes: null,
            loginField: 'email',
            oAuthBase: this.global.location.origin,
            oAuthPaths: {
                github: 'auth/github'
            },
            oAuthCallbackPath: 'oauth_callback',
            oAuthWindowType: 'newWindow',
            oAuthWindowOptions: null,
        };
        /** @type {?} */
        var mergedOptions = ((/** @type {?} */ (Object))).assign(defaultOptions, config);
        this.options = mergedOptions;
        if (this.options.apiBase === null) {
            console.warn("[angular-token] You have not configured 'apiBase', which may result in security issues. " +
                "Please refer to the documentation at https://github.com/neroniaky/angular-token/wiki");
        }
        this.tryLoadAuthData();
    }
    Object.defineProperty(AngularTokenService.prototype, "currentUserType", {
        get: /**
         * @return {?}
         */
        function () {
            if (this.userType.value != null) {
                return this.userType.value.name;
            }
            else {
                return undefined;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AngularTokenService.prototype, "currentUserData", {
        get: /**
         * @return {?}
         */
        function () {
            return this.userData.value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AngularTokenService.prototype, "currentAuthData", {
        get: /**
         * @return {?}
         */
        function () {
            return this.authData.value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AngularTokenService.prototype, "apiBase", {
        get: /**
         * @return {?}
         */
        function () {
            console.warn('[angular-token] The attribute .apiBase will be removed in the next major release, please use' +
                '.tokenOptions.apiBase instead');
            return this.options.apiBase;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AngularTokenService.prototype, "tokenOptions", {
        get: /**
         * @return {?}
         */
        function () {
            return this.options;
        },
        set: /**
         * @param {?} options
         * @return {?}
         */
        function (options) {
            this.options = ((/** @type {?} */ (Object))).assign(this.options, options);
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @return {?}
     */
    AngularTokenService.prototype.userSignedIn = /**
     * @return {?}
     */
    function () {
        if (this.authData.value == null) {
            return false;
        }
        else {
            return true;
        }
    };
    /**
     * @param {?} route
     * @param {?} state
     * @return {?}
     */
    AngularTokenService.prototype.canActivate = /**
     * @param {?} route
     * @param {?} state
     * @return {?}
     */
    function (route, state) {
        if (this.userSignedIn()) {
            return true;
        }
        else {
            // Store current location in storage (usefull for redirection after signing in)
            if (this.options.signInStoredUrlStorageKey) {
                this.localStorage.setItem(this.options.signInStoredUrlStorageKey, state.url);
            }
            // Redirect user to sign in if signInRedirect is set
            if (this.router && this.options.signInRedirect) {
                this.router.navigate([this.options.signInRedirect]);
            }
            return false;
        }
    };
    /**
     *
     * Actions
     *
     */
    // Register request
    /**
     *
     * Actions
     *
     * @param {?} registerData
     * @param {?=} additionalData
     * @return {?}
     */
    // Register request
    AngularTokenService.prototype.registerAccount = /**
     *
     * Actions
     *
     * @param {?} registerData
     * @param {?=} additionalData
     * @return {?}
     */
    // Register request
    function (registerData, additionalData) {
        registerData = Object.assign({}, registerData);
        if (registerData.userType == null) {
            this.userType.next(null);
        }
        else {
            this.userType.next(this.getUserTypeByName(registerData.userType));
            delete registerData.userType;
        }
        if (registerData.password_confirmation == null &&
            registerData.passwordConfirmation != null) {
            registerData.password_confirmation = registerData.passwordConfirmation;
            delete registerData.passwordConfirmation;
        }
        if (additionalData !== undefined) {
            registerData.additionalData = additionalData;
        }
        /** @type {?} */
        var login = registerData.login;
        delete registerData.login;
        registerData[this.options.loginField] = login;
        registerData.confirm_success_url = this.options.registerAccountCallback;
        return this.http.post(this.getServerPath() + this.options.registerAccountPath, registerData);
    };
    // Delete Account
    // Delete Account
    /**
     * @return {?}
     */
    AngularTokenService.prototype.deleteAccount = 
    // Delete Account
    /**
     * @return {?}
     */
    function () {
        return this.http.delete(this.getServerPath() + this.options.deleteAccountPath);
    };
    // Sign in request and set storage
    // Sign in request and set storage
    /**
     * @param {?} signInData
     * @param {?=} additionalData
     * @return {?}
     */
    AngularTokenService.prototype.signIn = 
    // Sign in request and set storage
    /**
     * @param {?} signInData
     * @param {?=} additionalData
     * @return {?}
     */
    function (signInData, additionalData) {
        var _this = this;
        var _a;
        this.userType.next((signInData.userType == null) ? null : this.getUserTypeByName(signInData.userType));
        /** @type {?} */
        var body = (_a = {},
            _a[this.options.loginField] = signInData.login,
            _a.password = signInData.password,
            _a);
        if (additionalData !== undefined) {
            body.additionalData = additionalData;
        }
        /** @type {?} */
        var observ = this.http.post(this.getServerPath() + this.options.signInPath, body).pipe(share());
        observ.subscribe(function (res) { return _this.userData.next(res.data); });
        return observ;
    };
    /**
     * @param {?} oAuthType
     * @return {?}
     */
    AngularTokenService.prototype.signInOAuth = /**
     * @param {?} oAuthType
     * @return {?}
     */
    function (oAuthType) {
        /** @type {?} */
        var oAuthPath = this.getOAuthPath(oAuthType);
        /** @type {?} */
        var callbackUrl = this.global.location.origin + "/" + this.options.oAuthCallbackPath;
        /** @type {?} */
        var oAuthWindowType = this.options.oAuthWindowType;
        /** @type {?} */
        var authUrl = this.getOAuthUrl(oAuthPath, callbackUrl, oAuthWindowType);
        if (oAuthWindowType === 'newWindow') {
            /** @type {?} */
            var oAuthWindowOptions = this.options.oAuthWindowOptions;
            /** @type {?} */
            var windowOptions = '';
            if (oAuthWindowOptions) {
                for (var key in oAuthWindowOptions) {
                    if (oAuthWindowOptions.hasOwnProperty(key)) {
                        windowOptions += "," + key + "=" + oAuthWindowOptions[key];
                    }
                }
            }
            /** @type {?} */
            var popup = window.open(authUrl, '_blank', "closebuttoncaption=Cancel" + windowOptions);
            return this.requestCredentialsViaPostMessage(popup);
        }
        else if (oAuthWindowType === 'sameWindow') {
            this.global.location.href = authUrl;
            return undefined;
        }
        else {
            throw new Error("Unsupported oAuthWindowType \"" + oAuthWindowType + "\"");
        }
    };
    /**
     * @return {?}
     */
    AngularTokenService.prototype.processOAuthCallback = /**
     * @return {?}
     */
    function () {
        this.getAuthDataFromParams();
    };
    // Sign out request and delete storage
    // Sign out request and delete storage
    /**
     * @return {?}
     */
    AngularTokenService.prototype.signOut = 
    // Sign out request and delete storage
    /**
     * @return {?}
     */
    function () {
        var _this = this;
        return this.http.delete(this.getServerPath() + this.options.signOutPath)
            // Only remove the localStorage and clear the data after the call
            .pipe(finalize(function () {
            _this.localStorage.removeItem('accessToken');
            _this.localStorage.removeItem('client');
            _this.localStorage.removeItem('expiry');
            _this.localStorage.removeItem('tokenType');
            _this.localStorage.removeItem('uid');
            _this.authData.next(null);
            _this.userType.next(null);
            _this.userData.next(null);
        }));
    };
    // Validate token request
    // Validate token request
    /**
     * @return {?}
     */
    AngularTokenService.prototype.validateToken = 
    // Validate token request
    /**
     * @return {?}
     */
    function () {
        var _this = this;
        /** @type {?} */
        var observ = this.http.get(this.getServerPath() + this.options.validateTokenPath).pipe(share());
        observ.subscribe(function (res) { return _this.userData.next(res.data); }, function (error) {
            if (error.status === 401 && _this.options.signOutFailedValidate) {
                _this.signOut();
            }
        });
        return observ;
    };
    // Update password request
    // Update password request
    /**
     * @param {?} updatePasswordData
     * @return {?}
     */
    AngularTokenService.prototype.updatePassword = 
    // Update password request
    /**
     * @param {?} updatePasswordData
     * @return {?}
     */
    function (updatePasswordData) {
        if (updatePasswordData.userType != null) {
            this.userType.next(this.getUserTypeByName(updatePasswordData.userType));
        }
        /** @type {?} */
        var args;
        if (updatePasswordData.passwordCurrent == null) {
            args = {
                password: updatePasswordData.password,
                password_confirmation: updatePasswordData.passwordConfirmation
            };
        }
        else {
            args = {
                current_password: updatePasswordData.passwordCurrent,
                password: updatePasswordData.password,
                password_confirmation: updatePasswordData.passwordConfirmation
            };
        }
        if (updatePasswordData.resetPasswordToken) {
            args.reset_password_token = updatePasswordData.resetPasswordToken;
        }
        /** @type {?} */
        var body = args;
        return this.http.put(this.getServerPath() + this.options.updatePasswordPath, body);
    };
    // Reset password request
    // Reset password request
    /**
     * @param {?} resetPasswordData
     * @return {?}
     */
    AngularTokenService.prototype.resetPassword = 
    // Reset password request
    /**
     * @param {?} resetPasswordData
     * @return {?}
     */
    function (resetPasswordData) {
        var _a;
        this.userType.next((resetPasswordData.userType == null) ? null : this.getUserTypeByName(resetPasswordData.userType));
        /** @type {?} */
        var body = (_a = {},
            _a[this.options.loginField] = resetPasswordData.login,
            _a.redirect_url = resetPasswordData.redirectUrl,
            _a);
        return this.http.post(this.getServerPath() + this.options.resetPasswordPath, body);
    };
    // Change password request
    // Change password request
    /**
     * @param {?} changePasswordData
     * @return {?}
     */
    AngularTokenService.prototype.changePassword = 
    // Change password request
    /**
     * @param {?} changePasswordData
     * @return {?}
     */
    function (changePasswordData) {
        /** @type {?} */
        var body = {
            password: changePasswordData.password,
            password_confirmation: changePasswordData.passwordConfirmation
        };
        // const headers: HttpHeaders = new HttpHeaders();
        // headers.append('uid', this.currentAuthData.uid);
        // headers.append('client', this.currentAuthData.client);
        // headers.append('access-token', this.currentAuthData.accessToken);
        return this.http.put(this.getServerPath() + this.options.changePasswordPath, body);
    };
    /**
     *
     * Construct Paths / Urls
     *
     */
    /**
     *
     * Construct Paths / Urls
     *
     * @private
     * @return {?}
     */
    AngularTokenService.prototype.getUserPath = /**
     *
     * Construct Paths / Urls
     *
     * @private
     * @return {?}
     */
    function () {
        return (this.userType.value == null) ? '' : this.userType.value.path + '/';
    };
    /**
     * @private
     * @return {?}
     */
    AngularTokenService.prototype.getApiPath = /**
     * @private
     * @return {?}
     */
    function () {
        /** @type {?} */
        var constructedPath = '';
        if (this.options.apiBase != null) {
            constructedPath += this.options.apiBase + '/';
        }
        if (this.options.apiPath != null) {
            constructedPath += this.options.apiPath + '/';
        }
        return constructedPath;
    };
    /**
     * @private
     * @return {?}
     */
    AngularTokenService.prototype.getServerPath = /**
     * @private
     * @return {?}
     */
    function () {
        return this.getApiPath() + this.getUserPath();
    };
    /**
     * @private
     * @param {?} oAuthType
     * @return {?}
     */
    AngularTokenService.prototype.getOAuthPath = /**
     * @private
     * @param {?} oAuthType
     * @return {?}
     */
    function (oAuthType) {
        /** @type {?} */
        var oAuthPath;
        oAuthPath = this.options.oAuthPaths[oAuthType];
        if (oAuthPath == null) {
            oAuthPath = "/auth/" + oAuthType;
        }
        return oAuthPath;
    };
    /**
     * @private
     * @param {?} oAuthPath
     * @param {?} callbackUrl
     * @param {?} windowType
     * @return {?}
     */
    AngularTokenService.prototype.getOAuthUrl = /**
     * @private
     * @param {?} oAuthPath
     * @param {?} callbackUrl
     * @param {?} windowType
     * @return {?}
     */
    function (oAuthPath, callbackUrl, windowType) {
        /** @type {?} */
        var url;
        url = this.options.oAuthBase + "/" + oAuthPath;
        url += "?omniauth_window_type=" + windowType;
        url += "&auth_origin_url=" + encodeURIComponent(callbackUrl);
        if (this.userType.value != null) {
            url += "&resource_class=" + this.userType.value.name;
        }
        return url;
    };
    /**
     *
     * Get Auth Data
     *
     */
    // Try to load auth data
    /**
     *
     * Get Auth Data
     *
     * @private
     * @return {?}
     */
    // Try to load auth data
    AngularTokenService.prototype.tryLoadAuthData = /**
     *
     * Get Auth Data
     *
     * @private
     * @return {?}
     */
    // Try to load auth data
    function () {
        /** @type {?} */
        var userType = this.getUserTypeByName(this.localStorage.getItem('userType'));
        if (userType) {
            this.userType.next(userType);
        }
        this.getAuthDataFromStorage();
        if (this.activatedRoute) {
            this.getAuthDataFromParams();
        }
        // if (this.authData) {
        //     this.validateToken();
        // }
    };
    // Parse Auth data from response
    // Parse Auth data from response
    /**
     * @param {?} data
     * @return {?}
     */
    AngularTokenService.prototype.getAuthHeadersFromResponse = 
    // Parse Auth data from response
    /**
     * @param {?} data
     * @return {?}
     */
    function (data) {
        /** @type {?} */
        var headers = data.headers;
        /** @type {?} */
        var authData = {
            accessToken: headers.get('access-token'),
            client: headers.get('client'),
            expiry: headers.get('expiry'),
            tokenType: headers.get('token-type'),
            uid: headers.get('uid')
        };
        this.setAuthData(authData);
    };
    // Parse Auth data from post message
    // Parse Auth data from post message
    /**
     * @private
     * @param {?} data
     * @return {?}
     */
    AngularTokenService.prototype.getAuthDataFromPostMessage = 
    // Parse Auth data from post message
    /**
     * @private
     * @param {?} data
     * @return {?}
     */
    function (data) {
        /** @type {?} */
        var authData = {
            accessToken: data['auth_token'],
            client: data['client_id'],
            expiry: data['expiry'],
            tokenType: 'Bearer',
            uid: data['uid']
        };
        this.setAuthData(authData);
    };
    // Try to get auth data from storage.
    // Try to get auth data from storage.
    /**
     * @return {?}
     */
    AngularTokenService.prototype.getAuthDataFromStorage = 
    // Try to get auth data from storage.
    /**
     * @return {?}
     */
    function () {
        /** @type {?} */
        var authData = {
            accessToken: this.localStorage.getItem('accessToken'),
            client: this.localStorage.getItem('client'),
            expiry: this.localStorage.getItem('expiry'),
            tokenType: this.localStorage.getItem('tokenType'),
            uid: this.localStorage.getItem('uid')
        };
        if (this.checkAuthData(authData)) {
            this.authData.next(authData);
        }
    };
    // Try to get auth data from url parameters.
    // Try to get auth data from url parameters.
    /**
     * @private
     * @return {?}
     */
    AngularTokenService.prototype.getAuthDataFromParams = 
    // Try to get auth data from url parameters.
    /**
     * @private
     * @return {?}
     */
    function () {
        var _this = this;
        this.activatedRoute.queryParams.subscribe(function (queryParams) {
            /** @type {?} */
            var authData = {
                accessToken: queryParams['token'] || queryParams['auth_token'],
                client: queryParams['client_id'],
                expiry: queryParams['expiry'],
                tokenType: 'Bearer',
                uid: queryParams['uid']
            };
            if (_this.checkAuthData(authData)) {
                _this.authData.next(authData);
            }
        });
    };
    // Try to get auth data from params obj.
    // Try to get auth data from params obj.
    /**
     * @param {?} queryParams
     * @return {?}
     */
    AngularTokenService.prototype.getAuthDataFromParamsObj = 
    // Try to get auth data from params obj.
    /**
     * @param {?} queryParams
     * @return {?}
     */
    function (queryParams) {
        /** @type {?} */
        var authData = {
            accessToken: queryParams['token'] || queryParams['auth_token'],
            client: queryParams['client_id'],
            expiry: queryParams['expiry'],
            tokenType: 'Bearer',
            uid: queryParams['uid']
        };
        if (this.checkAuthData(authData)) {
            this.authData.next(authData);
        }
    };
    /**
     *
     * Set Auth Data
     *
     */
    // Write auth data to storage
    /**
     *
     * Set Auth Data
     *
     * @private
     * @param {?} authData
     * @return {?}
     */
    // Write auth data to storage
    AngularTokenService.prototype.setAuthData = /**
     *
     * Set Auth Data
     *
     * @private
     * @param {?} authData
     * @return {?}
     */
    // Write auth data to storage
    function (authData) {
        if (this.checkAuthData(authData)) {
            this.authData.next(authData);
            this.localStorage.setItem('accessToken', authData.accessToken);
            this.localStorage.setItem('client', authData.client);
            this.localStorage.setItem('expiry', authData.expiry);
            this.localStorage.setItem('tokenType', authData.tokenType);
            this.localStorage.setItem('uid', authData.uid);
            if (this.userType.value != null) {
                this.localStorage.setItem('userType', this.userType.value.name);
            }
        }
    };
    /**
     *
     * Validate Auth Data
     *
     */
    // Check if auth data complete and if response token is newer
    /**
     *
     * Validate Auth Data
     *
     * @private
     * @param {?} authData
     * @return {?}
     */
    // Check if auth data complete and if response token is newer
    AngularTokenService.prototype.checkAuthData = /**
     *
     * Validate Auth Data
     *
     * @private
     * @param {?} authData
     * @return {?}
     */
    // Check if auth data complete and if response token is newer
    function (authData) {
        if (authData.accessToken != null &&
            authData.client != null &&
            authData.expiry != null &&
            authData.tokenType != null &&
            authData.uid != null) {
            if (this.authData.value != null) {
                return authData.expiry >= this.authData.value.expiry;
            }
            return true;
        }
        return false;
    };
    /**
     *
     * OAuth
     *
     */
    /**
     *
     * OAuth
     *
     * @private
     * @param {?} authWindow
     * @return {?}
     */
    AngularTokenService.prototype.requestCredentialsViaPostMessage = /**
     *
     * OAuth
     *
     * @private
     * @param {?} authWindow
     * @return {?}
     */
    function (authWindow) {
        /** @type {?} */
        var pollerObserv = interval(500);
        /** @type {?} */
        var responseObserv = fromEvent(this.global, 'message').pipe(pluck('data'), filter(this.oAuthWindowResponseFilter));
        responseObserv.subscribe(this.getAuthDataFromPostMessage.bind(this));
        /** @type {?} */
        var pollerSubscription = pollerObserv.subscribe(function () {
            if (authWindow.closed) {
                pollerSubscription.unsubscribe();
            }
            else {
                authWindow.postMessage('requestCredentials', '*');
            }
        });
        return responseObserv;
    };
    /**
     * @private
     * @param {?} data
     * @return {?}
     */
    AngularTokenService.prototype.oAuthWindowResponseFilter = /**
     * @private
     * @param {?} data
     * @return {?}
     */
    function (data) {
        if (data.message === 'deliverCredentials' || data.message === 'authFailure') {
            return data;
        }
    };
    /**
     *
     * Utilities
     *
     */
    // Match user config by user config name
    /**
     *
     * Utilities
     *
     * @private
     * @param {?} name
     * @return {?}
     */
    // Match user config by user config name
    AngularTokenService.prototype.getUserTypeByName = /**
     *
     * Utilities
     *
     * @private
     * @param {?} name
     * @return {?}
     */
    // Match user config by user config name
    function (name) {
        if (name == null || this.options.userTypes == null) {
            return null;
        }
        return this.options.userTypes.find(function (userType) { return userType.name === name; });
    };
    AngularTokenService.decorators = [
        { type: Injectable, args: [{
                    providedIn: 'root',
                },] }
    ];
    /** @nocollapse */
    AngularTokenService.ctorParameters = function () { return [
        { type: HttpClient },
        { type: undefined, decorators: [{ type: Inject, args: [ANGULAR_TOKEN_OPTIONS,] }] },
        { type: Object, decorators: [{ type: Inject, args: [PLATFORM_ID,] }] },
        { type: ActivatedRoute, decorators: [{ type: Optional }] },
        { type: Router, decorators: [{ type: Optional }] }
    ]; };
    /** @nocollapse */ AngularTokenService.ngInjectableDef = i0.defineInjectable({ factory: function AngularTokenService_Factory() { return new AngularTokenService(i0.inject(i1.HttpClient), i0.inject(i2.ANGULAR_TOKEN_OPTIONS), i0.inject(i0.PLATFORM_ID), i0.inject(i3.ActivatedRoute, 8), i0.inject(i3.Router, 8)); }, token: AngularTokenService, providedIn: "root" });
    return AngularTokenService;
}());
export { AngularTokenService };
if (false) {
    /**
     * @type {?}
     * @private
     */
    AngularTokenService.prototype.options;
    /** @type {?} */
    AngularTokenService.prototype.userType;
    /** @type {?} */
    AngularTokenService.prototype.authData;
    /** @type {?} */
    AngularTokenService.prototype.userData;
    /**
     * @type {?}
     * @private
     */
    AngularTokenService.prototype.global;
    /**
     * @type {?}
     * @private
     */
    AngularTokenService.prototype.localStorage;
    /**
     * @type {?}
     * @private
     */
    AngularTokenService.prototype.http;
    /**
     * @type {?}
     * @private
     */
    AngularTokenService.prototype.platformId;
    /**
     * @type {?}
     * @private
     */
    AngularTokenService.prototype.activatedRoute;
    /**
     * @type {?}
     * @private
     */
    AngularTokenService.prototype.router;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5ndWxhci10b2tlbi5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6Im5nOi8vYW5ndWxhci10b2tlbi8iLCJzb3VyY2VzIjpbImxpYi9hbmd1bGFyLXRva2VuLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDMUUsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLEVBQTRELE1BQU0saUJBQWlCLENBQUM7QUFDbkgsT0FBTyxFQUFFLFVBQVUsRUFBbUMsTUFBTSxzQkFBc0IsQ0FBQztBQUNuRixPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUVuRCxPQUFPLEVBQWMsU0FBUyxFQUFFLFFBQVEsRUFBRSxlQUFlLEVBQUUsTUFBTSxNQUFNLENBQUM7QUFDeEUsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBRWhFLE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxNQUFNLHVCQUF1QixDQUFDOzs7OztBQWlCOUQ7SUEyQ0UsNkJBQ1UsSUFBZ0IsRUFDTyxNQUFXLEVBQ2IsVUFBa0IsRUFDM0IsY0FBOEIsRUFDOUIsTUFBYztRQUoxQixTQUFJLEdBQUosSUFBSSxDQUFZO1FBRUssZUFBVSxHQUFWLFVBQVUsQ0FBUTtRQUMzQixtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7UUFDOUIsV0FBTSxHQUFOLE1BQU0sQ0FBUTtRQVo3QixhQUFRLEdBQThCLElBQUksZUFBZSxDQUFXLElBQUksQ0FBQyxDQUFDO1FBQzFFLGFBQVEsR0FBOEIsSUFBSSxlQUFlLENBQVcsSUFBSSxDQUFDLENBQUM7UUFDMUUsYUFBUSxHQUE4QixJQUFJLGVBQWUsQ0FBVyxJQUFJLENBQUMsQ0FBQztRQUd6RSxpQkFBWSxHQUFrQixFQUFFLENBQUM7UUFTdkMsSUFB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LElBQUksQ0FBQztTQUNiO1FBRUQsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQ2hDLFVBQUEsUUFBUSxJQUFJLE9BQUEsUUFBUSxDQUFDLElBQUksS0FBSyxJQUFJLEVBQXRCLENBQXNCLENBQ2pDLENBQUM7SUFDTixDQUFDOztnQkFqbUJILFVBQVUsU0FBQztvQkFDVixVQUFVLEVBQUUsTUFBTTtpQkFDbkI7Ozs7Z0JBekJRLFVBQVU7Z0RBb0VkLE1BQU0sU0FBQyxxQkFBcUI7Z0JBQ1ksTUFBTSx1QkFBOUMsTUFBTSxTQUFDLFdBQVc7Z0JBdEVkLGNBQWMsdUJBdUVsQixRQUFRO2dCQXZFWSxNQUFNLHVCQXdFMUIsUUFBUTs7OzhCQXpFYjtDQTJuQkUsQUFsbUJGLElBa21CRTtTQS9sQlcsbUJBQW1COzs7Ozs7SUFnQzlCLHNDQUFxQzs7SUFDckMsdUNBQWlGOztJQUNqRix1Q0FBaUY7O0lBQ2pGLHVDQUFpRjs7Ozs7SUFDakYscUNBQTZCOzs7OztJQUU3QiwyQ0FBeUM7Ozs7O0lBR3ZDLG1DQUF3Qjs7Ozs7SUFFeEIseUNBQStDOzs7OztJQUMvQyw2Q0FBa0Q7Ozs7O0lBQ2xELHFDQUFrQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluamVjdGFibGUsIE9wdGlvbmFsLCBJbmplY3QsIFBMQVRGT1JNX0lEIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBBY3RpdmF0ZWRSb3V0ZSwgUm91dGVyLCBDYW5BY3RpdmF0ZSwgQWN0aXZhdGVkUm91dGVTbmFwc2hvdCwgUm91dGVyU3RhdGVTbmFwc2hvdCB9IGZyb20gJ0Bhbmd1bGFyL3JvdXRlcic7XG5pbXBvcnQgeyBIdHRwQ2xpZW50LCBIdHRwUmVzcG9uc2UsIEh0dHBFcnJvclJlc3BvbnNlIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnO1xuaW1wb3J0IHsgaXNQbGF0Zm9ybVNlcnZlciB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5cbmltcG9ydCB7IE9ic2VydmFibGUsIGZyb21FdmVudCwgaW50ZXJ2YWwsIEJlaGF2aW9yU3ViamVjdCB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgcGx1Y2ssIGZpbHRlciwgc2hhcmUsIGZpbmFsaXplIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG5pbXBvcnQgeyBBTkdVTEFSX1RPS0VOX09QVElPTlMgfSBmcm9tICcuL2FuZ3VsYXItdG9rZW4udG9rZW4nO1xuXG5pbXBvcnQge1xuICBTaWduSW5EYXRhLFxuICBSZWdpc3RlckRhdGEsXG4gIFVwZGF0ZVBhc3N3b3JkRGF0YSxcbiAgUmVzZXRQYXNzd29yZERhdGEsXG4gIENoYW5nZVBhc3N3b3JkRGF0YSxcblxuICBVc2VyVHlwZSxcbiAgVXNlckRhdGEsXG4gIEF1dGhEYXRhLFxuICBBcGlSZXNwb25zZSxcblxuICBBbmd1bGFyVG9rZW5PcHRpb25zXG59IGZyb20gJy4vYW5ndWxhci10b2tlbi5tb2RlbCc7XG5cbkBJbmplY3RhYmxlKHtcbiAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxufSlcbmV4cG9ydCBjbGFzcyBBbmd1bGFyVG9rZW5TZXJ2aWNlIGltcGxlbWVudHMgQ2FuQWN0aXZhdGUge1xuXG4gIGdldCBjdXJyZW50VXNlclR5cGUoKTogc3RyaW5nIHtcbiAgICBpZiAodGhpcy51c2VyVHlwZS52YWx1ZSAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gdGhpcy51c2VyVHlwZS52YWx1ZS5uYW1lO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgfVxuXG4gIGdldCBjdXJyZW50VXNlckRhdGEoKTogVXNlckRhdGEge1xuICAgIHJldHVybiB0aGlzLnVzZXJEYXRhLnZhbHVlO1xuICB9XG5cbiAgZ2V0IGN1cnJlbnRBdXRoRGF0YSgpOiBBdXRoRGF0YSB7XG4gICAgcmV0dXJuIHRoaXMuYXV0aERhdGEudmFsdWU7XG4gIH1cblxuICBnZXQgYXBpQmFzZSgpOiBzdHJpbmcge1xuICAgIGNvbnNvbGUud2FybignW2FuZ3VsYXItdG9rZW5dIFRoZSBhdHRyaWJ1dGUgLmFwaUJhc2Ugd2lsbCBiZSByZW1vdmVkIGluIHRoZSBuZXh0IG1ham9yIHJlbGVhc2UsIHBsZWFzZSB1c2UnICtcbiAgICAnLnRva2VuT3B0aW9ucy5hcGlCYXNlIGluc3RlYWQnKTtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLmFwaUJhc2U7XG4gIH1cblxuICBnZXQgdG9rZW5PcHRpb25zKCk6IEFuZ3VsYXJUb2tlbk9wdGlvbnMge1xuICAgIHJldHVybiB0aGlzLm9wdGlvbnM7XG4gIH1cblxuICBzZXQgdG9rZW5PcHRpb25zKG9wdGlvbnM6IEFuZ3VsYXJUb2tlbk9wdGlvbnMpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSAoPGFueT5PYmplY3QpLmFzc2lnbih0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuICB9XG5cbiAgcHJpdmF0ZSBvcHRpb25zOiBBbmd1bGFyVG9rZW5PcHRpb25zO1xuICBwdWJsaWMgdXNlclR5cGU6IEJlaGF2aW9yU3ViamVjdDxVc2VyVHlwZT4gPSBuZXcgQmVoYXZpb3JTdWJqZWN0PFVzZXJUeXBlPihudWxsKTtcbiAgcHVibGljIGF1dGhEYXRhOiBCZWhhdmlvclN1YmplY3Q8QXV0aERhdGE+ID0gbmV3IEJlaGF2aW9yU3ViamVjdDxBdXRoRGF0YT4obnVsbCk7XG4gIHB1YmxpYyB1c2VyRGF0YTogQmVoYXZpb3JTdWJqZWN0PFVzZXJEYXRhPiA9IG5ldyBCZWhhdmlvclN1YmplY3Q8VXNlckRhdGE+KG51bGwpO1xuICBwcml2YXRlIGdsb2JhbDogV2luZG93IHwgYW55O1xuXG4gIHByaXZhdGUgbG9jYWxTdG9yYWdlOiBTdG9yYWdlIHwgYW55ID0ge307XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBodHRwOiBIdHRwQ2xpZW50LFxuICAgIEBJbmplY3QoQU5HVUxBUl9UT0tFTl9PUFRJT05TKSBjb25maWc6IGFueSxcbiAgICBASW5qZWN0KFBMQVRGT1JNX0lEKSBwcml2YXRlIHBsYXRmb3JtSWQ6IE9iamVjdCxcbiAgICBAT3B0aW9uYWwoKSBwcml2YXRlIGFjdGl2YXRlZFJvdXRlOiBBY3RpdmF0ZWRSb3V0ZSxcbiAgICBAT3B0aW9uYWwoKSBwcml2YXRlIHJvdXRlcjogUm91dGVyXG4gICkge1xuICAgIHRoaXMuZ2xvYmFsID0gKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSA/IHdpbmRvdyA6IHt9O1xuXG4gICAgaWYgKGlzUGxhdGZvcm1TZXJ2ZXIodGhpcy5wbGF0Zm9ybUlkKSkge1xuXG4gICAgICAvLyBCYWQgcHJhdGljZSwgbmVlZHMgZml4aW5nXG4gICAgICB0aGlzLmdsb2JhbCA9IHtcbiAgICAgICAgb3BlbjogKCk6IHZvaWQgPT4gbnVsbCxcbiAgICAgICAgbG9jYXRpb246IHtcbiAgICAgICAgICBocmVmOiAnLycsXG4gICAgICAgICAgb3JpZ2luOiAnLydcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgLy8gQmFkIHByYXRpY2UsIG5lZWRzIGZpeGluZ1xuICAgICAgdGhpcy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbSA9ICgpOiB2b2lkID0+IG51bGw7XG4gICAgICB0aGlzLmxvY2FsU3RvcmFnZS5nZXRJdGVtID0gKCk6IHZvaWQgPT4gbnVsbDtcbiAgICAgIHRoaXMubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0gPSAoKTogdm9pZCA9PiBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmxvY2FsU3RvcmFnZSA9IGxvY2FsU3RvcmFnZTtcbiAgICB9XG5cbiAgICBjb25zdCBkZWZhdWx0T3B0aW9uczogQW5ndWxhclRva2VuT3B0aW9ucyA9IHtcbiAgICAgIGFwaVBhdGg6ICAgICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgYXBpQmFzZTogICAgICAgICAgICAgICAgICAgIG51bGwsXG5cbiAgICAgIHNpZ25JblBhdGg6ICAgICAgICAgICAgICAgICAnYXV0aC9zaWduX2luJyxcbiAgICAgIHNpZ25JblJlZGlyZWN0OiAgICAgICAgICAgICBudWxsLFxuICAgICAgc2lnbkluU3RvcmVkVXJsU3RvcmFnZUtleTogIG51bGwsXG5cbiAgICAgIHNpZ25PdXRQYXRoOiAgICAgICAgICAgICAgICAnYXV0aC9zaWduX291dCcsXG4gICAgICB2YWxpZGF0ZVRva2VuUGF0aDogICAgICAgICAgJ2F1dGgvdmFsaWRhdGVfdG9rZW4nLFxuICAgICAgc2lnbk91dEZhaWxlZFZhbGlkYXRlOiAgICAgIGZhbHNlLFxuXG4gICAgICByZWdpc3RlckFjY291bnRQYXRoOiAgICAgICAgJ2F1dGgnLFxuICAgICAgZGVsZXRlQWNjb3VudFBhdGg6ICAgICAgICAgICdhdXRoJyxcbiAgICAgIHJlZ2lzdGVyQWNjb3VudENhbGxiYWNrOiAgICB0aGlzLmdsb2JhbC5sb2NhdGlvbi5ocmVmLFxuXG4gICAgICB1cGRhdGVQYXNzd29yZFBhdGg6ICAgICAgICAgJ2F1dGgnLFxuICAgICAgY2hhbmdlUGFzc3dvcmRQYXRoOiAgICAgICAgICdhdXRoL3Bhc3N3b3JkJyxcblxuICAgICAgcmVzZXRQYXNzd29yZFBhdGg6ICAgICAgICAgICdhdXRoL3Bhc3N3b3JkJyxcbiAgICAgIHJlc2V0UGFzc3dvcmRDYWxsYmFjazogICAgICB0aGlzLmdsb2JhbC5sb2NhdGlvbi5ocmVmLFxuXG4gICAgICB1c2VyVHlwZXM6ICAgICAgICAgICAgICAgICAgbnVsbCxcbiAgICAgIGxvZ2luRmllbGQ6ICAgICAgICAgICAgICAgICAnZW1haWwnLFxuXG4gICAgICBvQXV0aEJhc2U6ICAgICAgICAgICAgICAgICAgdGhpcy5nbG9iYWwubG9jYXRpb24ub3JpZ2luLFxuICAgICAgb0F1dGhQYXRoczoge1xuICAgICAgICBnaXRodWI6ICAgICAgICAgICAgICAgICAgICdhdXRoL2dpdGh1YidcbiAgICAgIH0sXG4gICAgICBvQXV0aENhbGxiYWNrUGF0aDogICAgICAgICAgJ29hdXRoX2NhbGxiYWNrJyxcbiAgICAgIG9BdXRoV2luZG93VHlwZTogICAgICAgICAgICAnbmV3V2luZG93JyxcbiAgICAgIG9BdXRoV2luZG93T3B0aW9uczogICAgICAgICBudWxsLFxuICAgIH07XG5cbiAgICBjb25zdCBtZXJnZWRPcHRpb25zID0gKDxhbnk+T2JqZWN0KS5hc3NpZ24oZGVmYXVsdE9wdGlvbnMsIGNvbmZpZyk7XG4gICAgdGhpcy5vcHRpb25zID0gbWVyZ2VkT3B0aW9ucztcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuYXBpQmFzZSA9PT0gbnVsbCkge1xuICAgICAgY29uc29sZS53YXJuKGBbYW5ndWxhci10b2tlbl0gWW91IGhhdmUgbm90IGNvbmZpZ3VyZWQgJ2FwaUJhc2UnLCB3aGljaCBtYXkgcmVzdWx0IGluIHNlY3VyaXR5IGlzc3Vlcy4gYCArXG4gICAgICAgICAgICAgICAgICAgYFBsZWFzZSByZWZlciB0byB0aGUgZG9jdW1lbnRhdGlvbiBhdCBodHRwczovL2dpdGh1Yi5jb20vbmVyb25pYWt5L2FuZ3VsYXItdG9rZW4vd2lraWApO1xuICAgIH1cblxuICAgIHRoaXMudHJ5TG9hZEF1dGhEYXRhKCk7XG4gIH1cblxuICB1c2VyU2lnbmVkSW4oKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuYXV0aERhdGEudmFsdWUgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBjYW5BY3RpdmF0ZShyb3V0ZTogQWN0aXZhdGVkUm91dGVTbmFwc2hvdCwgc3RhdGU6IFJvdXRlclN0YXRlU25hcHNob3QpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy51c2VyU2lnbmVkSW4oKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFN0b3JlIGN1cnJlbnQgbG9jYXRpb24gaW4gc3RvcmFnZSAodXNlZnVsbCBmb3IgcmVkaXJlY3Rpb24gYWZ0ZXIgc2lnbmluZyBpbilcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2lnbkluU3RvcmVkVXJsU3RvcmFnZUtleSkge1xuICAgICAgICB0aGlzLmxvY2FsU3RvcmFnZS5zZXRJdGVtKFxuICAgICAgICAgIHRoaXMub3B0aW9ucy5zaWduSW5TdG9yZWRVcmxTdG9yYWdlS2V5LFxuICAgICAgICAgIHN0YXRlLnVybFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICAvLyBSZWRpcmVjdCB1c2VyIHRvIHNpZ24gaW4gaWYgc2lnbkluUmVkaXJlY3QgaXMgc2V0XG4gICAgICBpZiAodGhpcy5yb3V0ZXIgJiYgdGhpcy5vcHRpb25zLnNpZ25JblJlZGlyZWN0KSB7XG4gICAgICAgIHRoaXMucm91dGVyLm5hdmlnYXRlKFt0aGlzLm9wdGlvbnMuc2lnbkluUmVkaXJlY3RdKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG5cbiAgLyoqXG4gICAqXG4gICAqIEFjdGlvbnNcbiAgICpcbiAgICovXG5cbiAgLy8gUmVnaXN0ZXIgcmVxdWVzdFxuICByZWdpc3RlckFjY291bnQocmVnaXN0ZXJEYXRhOiBSZWdpc3RlckRhdGEsIGFkZGl0aW9uYWxEYXRhPzogYW55KTogT2JzZXJ2YWJsZTxBcGlSZXNwb25zZT4ge1xuXG4gICAgcmVnaXN0ZXJEYXRhID0gT2JqZWN0LmFzc2lnbih7fSwgcmVnaXN0ZXJEYXRhKTtcblxuICAgIGlmIChyZWdpc3RlckRhdGEudXNlclR5cGUgPT0gbnVsbCkge1xuICAgICAgdGhpcy51c2VyVHlwZS5uZXh0KG51bGwpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnVzZXJUeXBlLm5leHQodGhpcy5nZXRVc2VyVHlwZUJ5TmFtZShyZWdpc3RlckRhdGEudXNlclR5cGUpKTtcbiAgICAgIGRlbGV0ZSByZWdpc3RlckRhdGEudXNlclR5cGU7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgcmVnaXN0ZXJEYXRhLnBhc3N3b3JkX2NvbmZpcm1hdGlvbiA9PSBudWxsICYmXG4gICAgICByZWdpc3RlckRhdGEucGFzc3dvcmRDb25maXJtYXRpb24gIT0gbnVsbFxuICAgICkge1xuICAgICAgcmVnaXN0ZXJEYXRhLnBhc3N3b3JkX2NvbmZpcm1hdGlvbiA9IHJlZ2lzdGVyRGF0YS5wYXNzd29yZENvbmZpcm1hdGlvbjtcbiAgICAgIGRlbGV0ZSByZWdpc3RlckRhdGEucGFzc3dvcmRDb25maXJtYXRpb247XG4gICAgfVxuXG4gICAgaWYgKGFkZGl0aW9uYWxEYXRhICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJlZ2lzdGVyRGF0YS5hZGRpdGlvbmFsRGF0YSA9IGFkZGl0aW9uYWxEYXRhO1xuICAgIH1cblxuICAgIGNvbnN0IGxvZ2luID0gcmVnaXN0ZXJEYXRhLmxvZ2luO1xuICAgIGRlbGV0ZSByZWdpc3RlckRhdGEubG9naW47XG4gICAgcmVnaXN0ZXJEYXRhW3RoaXMub3B0aW9ucy5sb2dpbkZpZWxkXSA9IGxvZ2luO1xuXG4gICAgcmVnaXN0ZXJEYXRhLmNvbmZpcm1fc3VjY2Vzc191cmwgPSB0aGlzLm9wdGlvbnMucmVnaXN0ZXJBY2NvdW50Q2FsbGJhY2s7XG5cbiAgICByZXR1cm4gdGhpcy5odHRwLnBvc3Q8QXBpUmVzcG9uc2U+KFxuICAgICAgdGhpcy5nZXRTZXJ2ZXJQYXRoKCkgKyB0aGlzLm9wdGlvbnMucmVnaXN0ZXJBY2NvdW50UGF0aCwgcmVnaXN0ZXJEYXRhXG4gICAgKTtcbiAgfVxuXG4gIC8vIERlbGV0ZSBBY2NvdW50XG4gIGRlbGV0ZUFjY291bnQoKTogT2JzZXJ2YWJsZTxBcGlSZXNwb25zZT4ge1xuICAgIHJldHVybiB0aGlzLmh0dHAuZGVsZXRlPEFwaVJlc3BvbnNlPih0aGlzLmdldFNlcnZlclBhdGgoKSArIHRoaXMub3B0aW9ucy5kZWxldGVBY2NvdW50UGF0aCk7XG4gIH1cblxuICAvLyBTaWduIGluIHJlcXVlc3QgYW5kIHNldCBzdG9yYWdlXG4gIHNpZ25JbihzaWduSW5EYXRhOiBTaWduSW5EYXRhLCBhZGRpdGlvbmFsRGF0YT86IGFueSk6IE9ic2VydmFibGU8QXBpUmVzcG9uc2U+IHtcbiAgICB0aGlzLnVzZXJUeXBlLm5leHQoKHNpZ25JbkRhdGEudXNlclR5cGUgPT0gbnVsbCkgPyBudWxsIDogdGhpcy5nZXRVc2VyVHlwZUJ5TmFtZShzaWduSW5EYXRhLnVzZXJUeXBlKSk7XG5cbiAgICBjb25zdCBib2R5ID0ge1xuICAgICAgW3RoaXMub3B0aW9ucy5sb2dpbkZpZWxkXTogc2lnbkluRGF0YS5sb2dpbixcbiAgICAgIHBhc3N3b3JkOiBzaWduSW5EYXRhLnBhc3N3b3JkXG4gICAgfTtcblxuICAgIGlmIChhZGRpdGlvbmFsRGF0YSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBib2R5LmFkZGl0aW9uYWxEYXRhID0gYWRkaXRpb25hbERhdGE7XG4gICAgfVxuXG4gICAgY29uc3Qgb2JzZXJ2ID0gdGhpcy5odHRwLnBvc3Q8QXBpUmVzcG9uc2U+KFxuICAgICAgdGhpcy5nZXRTZXJ2ZXJQYXRoKCkgKyB0aGlzLm9wdGlvbnMuc2lnbkluUGF0aCwgYm9keVxuICAgICkucGlwZShzaGFyZSgpKTtcblxuICAgIG9ic2Vydi5zdWJzY3JpYmUocmVzID0+IHRoaXMudXNlckRhdGEubmV4dChyZXMuZGF0YSkpO1xuXG4gICAgcmV0dXJuIG9ic2VydjtcbiAgfVxuXG4gIHNpZ25Jbk9BdXRoKG9BdXRoVHlwZTogc3RyaW5nKSB7XG5cbiAgICBjb25zdCBvQXV0aFBhdGg6IHN0cmluZyA9IHRoaXMuZ2V0T0F1dGhQYXRoKG9BdXRoVHlwZSk7XG4gICAgY29uc3QgY2FsbGJhY2tVcmwgPSBgJHt0aGlzLmdsb2JhbC5sb2NhdGlvbi5vcmlnaW59LyR7dGhpcy5vcHRpb25zLm9BdXRoQ2FsbGJhY2tQYXRofWA7XG4gICAgY29uc3Qgb0F1dGhXaW5kb3dUeXBlOiBzdHJpbmcgPSB0aGlzLm9wdGlvbnMub0F1dGhXaW5kb3dUeXBlO1xuICAgIGNvbnN0IGF1dGhVcmw6IHN0cmluZyA9IHRoaXMuZ2V0T0F1dGhVcmwob0F1dGhQYXRoLCBjYWxsYmFja1VybCwgb0F1dGhXaW5kb3dUeXBlKTtcblxuICAgIGlmIChvQXV0aFdpbmRvd1R5cGUgPT09ICduZXdXaW5kb3cnKSB7XG4gICAgICBjb25zdCBvQXV0aFdpbmRvd09wdGlvbnMgPSB0aGlzLm9wdGlvbnMub0F1dGhXaW5kb3dPcHRpb25zO1xuICAgICAgbGV0IHdpbmRvd09wdGlvbnMgPSAnJztcblxuICAgICAgaWYgKG9BdXRoV2luZG93T3B0aW9ucykge1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBvQXV0aFdpbmRvd09wdGlvbnMpIHtcbiAgICAgICAgICBpZiAob0F1dGhXaW5kb3dPcHRpb25zLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgd2luZG93T3B0aW9ucyArPSBgLCR7a2V5fT0ke29BdXRoV2luZG93T3B0aW9uc1trZXldfWA7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHBvcHVwID0gd2luZG93Lm9wZW4oXG4gICAgICAgICAgYXV0aFVybCxcbiAgICAgICAgICAnX2JsYW5rJyxcbiAgICAgICAgICBgY2xvc2VidXR0b25jYXB0aW9uPUNhbmNlbCR7d2luZG93T3B0aW9uc31gXG4gICAgICApO1xuICAgICAgcmV0dXJuIHRoaXMucmVxdWVzdENyZWRlbnRpYWxzVmlhUG9zdE1lc3NhZ2UocG9wdXApO1xuICAgIH0gZWxzZSBpZiAob0F1dGhXaW5kb3dUeXBlID09PSAnc2FtZVdpbmRvdycpIHtcbiAgICAgIHRoaXMuZ2xvYmFsLmxvY2F0aW9uLmhyZWYgPSBhdXRoVXJsO1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBvQXV0aFdpbmRvd1R5cGUgXCIke29BdXRoV2luZG93VHlwZX1cImApO1xuICAgIH1cbiAgfVxuXG4gIHByb2Nlc3NPQXV0aENhbGxiYWNrKCk6IHZvaWQge1xuICAgIHRoaXMuZ2V0QXV0aERhdGFGcm9tUGFyYW1zKCk7XG4gIH1cblxuICAvLyBTaWduIG91dCByZXF1ZXN0IGFuZCBkZWxldGUgc3RvcmFnZVxuICBzaWduT3V0KCk6IE9ic2VydmFibGU8QXBpUmVzcG9uc2U+IHtcbiAgICByZXR1cm4gdGhpcy5odHRwLmRlbGV0ZTxBcGlSZXNwb25zZT4odGhpcy5nZXRTZXJ2ZXJQYXRoKCkgKyB0aGlzLm9wdGlvbnMuc2lnbk91dFBhdGgpXG4gICAgICAvLyBPbmx5IHJlbW92ZSB0aGUgbG9jYWxTdG9yYWdlIGFuZCBjbGVhciB0aGUgZGF0YSBhZnRlciB0aGUgY2FsbFxuICAgICAgLnBpcGUoXG4gICAgICAgIGZpbmFsaXplKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2FjY2Vzc1Rva2VuJyk7XG4gICAgICAgICAgICB0aGlzLmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdjbGllbnQnKTtcbiAgICAgICAgICAgIHRoaXMubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2V4cGlyeScpO1xuICAgICAgICAgICAgdGhpcy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgndG9rZW5UeXBlJyk7XG4gICAgICAgICAgICB0aGlzLmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCd1aWQnKTtcblxuICAgICAgICAgICAgdGhpcy5hdXRoRGF0YS5uZXh0KG51bGwpO1xuICAgICAgICAgICAgdGhpcy51c2VyVHlwZS5uZXh0KG51bGwpO1xuICAgICAgICAgICAgdGhpcy51c2VyRGF0YS5uZXh0KG51bGwpO1xuICAgICAgICAgIH1cbiAgICAgICAgKVxuICAgICAgKTtcbiAgfVxuXG4gIC8vIFZhbGlkYXRlIHRva2VuIHJlcXVlc3RcbiAgdmFsaWRhdGVUb2tlbigpOiBPYnNlcnZhYmxlPEFwaVJlc3BvbnNlPiB7XG4gICAgY29uc3Qgb2JzZXJ2ID0gdGhpcy5odHRwLmdldDxBcGlSZXNwb25zZT4oXG4gICAgICB0aGlzLmdldFNlcnZlclBhdGgoKSArIHRoaXMub3B0aW9ucy52YWxpZGF0ZVRva2VuUGF0aFxuICAgICkucGlwZShzaGFyZSgpKTtcblxuICAgIG9ic2Vydi5zdWJzY3JpYmUoXG4gICAgICAocmVzKSA9PiB0aGlzLnVzZXJEYXRhLm5leHQocmVzLmRhdGEpLFxuICAgICAgKGVycm9yKSA9PiB7XG4gICAgICAgIGlmIChlcnJvci5zdGF0dXMgPT09IDQwMSAmJiB0aGlzLm9wdGlvbnMuc2lnbk91dEZhaWxlZFZhbGlkYXRlKSB7XG4gICAgICAgICAgdGhpcy5zaWduT3V0KCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBvYnNlcnY7XG4gIH1cblxuICAvLyBVcGRhdGUgcGFzc3dvcmQgcmVxdWVzdFxuICB1cGRhdGVQYXNzd29yZCh1cGRhdGVQYXNzd29yZERhdGE6IFVwZGF0ZVBhc3N3b3JkRGF0YSk6IE9ic2VydmFibGU8QXBpUmVzcG9uc2U+IHtcblxuICAgIGlmICh1cGRhdGVQYXNzd29yZERhdGEudXNlclR5cGUgIT0gbnVsbCkge1xuICAgICAgdGhpcy51c2VyVHlwZS5uZXh0KHRoaXMuZ2V0VXNlclR5cGVCeU5hbWUodXBkYXRlUGFzc3dvcmREYXRhLnVzZXJUeXBlKSk7XG4gICAgfVxuXG4gICAgbGV0IGFyZ3M6IGFueTtcblxuICAgIGlmICh1cGRhdGVQYXNzd29yZERhdGEucGFzc3dvcmRDdXJyZW50ID09IG51bGwpIHtcbiAgICAgIGFyZ3MgPSB7XG4gICAgICAgIHBhc3N3b3JkOiAgICAgICAgICAgICAgIHVwZGF0ZVBhc3N3b3JkRGF0YS5wYXNzd29yZCxcbiAgICAgICAgcGFzc3dvcmRfY29uZmlybWF0aW9uOiAgdXBkYXRlUGFzc3dvcmREYXRhLnBhc3N3b3JkQ29uZmlybWF0aW9uXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBhcmdzID0ge1xuICAgICAgICBjdXJyZW50X3Bhc3N3b3JkOiAgICAgICB1cGRhdGVQYXNzd29yZERhdGEucGFzc3dvcmRDdXJyZW50LFxuICAgICAgICBwYXNzd29yZDogICAgICAgICAgICAgICB1cGRhdGVQYXNzd29yZERhdGEucGFzc3dvcmQsXG4gICAgICAgIHBhc3N3b3JkX2NvbmZpcm1hdGlvbjogIHVwZGF0ZVBhc3N3b3JkRGF0YS5wYXNzd29yZENvbmZpcm1hdGlvblxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAodXBkYXRlUGFzc3dvcmREYXRhLnJlc2V0UGFzc3dvcmRUb2tlbikge1xuICAgICAgYXJncy5yZXNldF9wYXNzd29yZF90b2tlbiA9IHVwZGF0ZVBhc3N3b3JkRGF0YS5yZXNldFBhc3N3b3JkVG9rZW47XG4gICAgfVxuXG4gICAgY29uc3QgYm9keSA9IGFyZ3M7XG4gICAgcmV0dXJuIHRoaXMuaHR0cC5wdXQ8QXBpUmVzcG9uc2U+KHRoaXMuZ2V0U2VydmVyUGF0aCgpICsgdGhpcy5vcHRpb25zLnVwZGF0ZVBhc3N3b3JkUGF0aCwgYm9keSk7XG4gIH1cblxuICAvLyBSZXNldCBwYXNzd29yZCByZXF1ZXN0XG4gIHJlc2V0UGFzc3dvcmQocmVzZXRQYXNzd29yZERhdGE6IFJlc2V0UGFzc3dvcmREYXRhKTogT2JzZXJ2YWJsZTxBcGlSZXNwb25zZT4ge1xuXG4gICAgdGhpcy51c2VyVHlwZS5uZXh0KFxuICAgICAgKHJlc2V0UGFzc3dvcmREYXRhLnVzZXJUeXBlID09IG51bGwpID8gbnVsbCA6IHRoaXMuZ2V0VXNlclR5cGVCeU5hbWUocmVzZXRQYXNzd29yZERhdGEudXNlclR5cGUpXG4gICAgKTtcblxuICAgIGNvbnN0IGJvZHkgPSB7XG4gICAgICBbdGhpcy5vcHRpb25zLmxvZ2luRmllbGRdOiByZXNldFBhc3N3b3JkRGF0YS5sb2dpbixcbiAgICAgIHJlZGlyZWN0X3VybDogcmVzZXRQYXNzd29yZERhdGEucmVkaXJlY3RVcmxcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRoaXMuaHR0cC5wb3N0PEFwaVJlc3BvbnNlPih0aGlzLmdldFNlcnZlclBhdGgoKSArIHRoaXMub3B0aW9ucy5yZXNldFBhc3N3b3JkUGF0aCwgYm9keSk7XG4gIH1cblxuICAvLyBDaGFuZ2UgcGFzc3dvcmQgcmVxdWVzdFxuICBjaGFuZ2VQYXNzd29yZChjaGFuZ2VQYXNzd29yZERhdGE6IENoYW5nZVBhc3N3b3JkRGF0YSk6IE9ic2VydmFibGU8QXBpUmVzcG9uc2U+IHtcblxuICAgIGNvbnN0IGJvZHkgPSB7XG4gICAgICBwYXNzd29yZDogY2hhbmdlUGFzc3dvcmREYXRhLnBhc3N3b3JkLFxuICAgICAgcGFzc3dvcmRfY29uZmlybWF0aW9uOiBjaGFuZ2VQYXNzd29yZERhdGEucGFzc3dvcmRDb25maXJtYXRpb25cbiAgICB9O1xuXG4gICAgLy8gY29uc3QgaGVhZGVyczogSHR0cEhlYWRlcnMgPSBuZXcgSHR0cEhlYWRlcnMoKTtcbiAgICAvLyBoZWFkZXJzLmFwcGVuZCgndWlkJywgdGhpcy5jdXJyZW50QXV0aERhdGEudWlkKTtcbiAgICAvLyBoZWFkZXJzLmFwcGVuZCgnY2xpZW50JywgdGhpcy5jdXJyZW50QXV0aERhdGEuY2xpZW50KTtcbiAgICAvLyBoZWFkZXJzLmFwcGVuZCgnYWNjZXNzLXRva2VuJywgdGhpcy5jdXJyZW50QXV0aERhdGEuYWNjZXNzVG9rZW4pO1xuXG4gICAgcmV0dXJuIHRoaXMuaHR0cC5wdXQ8QXBpUmVzcG9uc2U+KHRoaXMuZ2V0U2VydmVyUGF0aCgpICsgdGhpcy5vcHRpb25zLmNoYW5nZVBhc3N3b3JkUGF0aCwgYm9keSk7XG4gIH1cblxuXG4gIC8qKlxuICAgKlxuICAgKiBDb25zdHJ1Y3QgUGF0aHMgLyBVcmxzXG4gICAqXG4gICAqL1xuXG4gICBwcml2YXRlIGdldFVzZXJQYXRoKCk6IHN0cmluZyB7XG4gICAgIHJldHVybiAodGhpcy51c2VyVHlwZS52YWx1ZSA9PSBudWxsKSA/ICcnIDogdGhpcy51c2VyVHlwZS52YWx1ZS5wYXRoICsgJy8nO1xuICAgfVxuXG4gICBwcml2YXRlIGdldEFwaVBhdGgoKTogc3RyaW5nIHtcbiAgICAgbGV0IGNvbnN0cnVjdGVkUGF0aCA9ICcnO1xuXG4gICAgIGlmICh0aGlzLm9wdGlvbnMuYXBpQmFzZSAhPSBudWxsKSB7XG4gICAgICAgY29uc3RydWN0ZWRQYXRoICs9IHRoaXMub3B0aW9ucy5hcGlCYXNlICsgJy8nO1xuICAgICB9XG5cbiAgICAgaWYgKHRoaXMub3B0aW9ucy5hcGlQYXRoICE9IG51bGwpIHtcbiAgICAgICBjb25zdHJ1Y3RlZFBhdGggKz0gdGhpcy5vcHRpb25zLmFwaVBhdGggKyAnLyc7XG4gICAgIH1cblxuICAgICByZXR1cm4gY29uc3RydWN0ZWRQYXRoO1xuICAgfVxuXG4gICBwcml2YXRlIGdldFNlcnZlclBhdGgoKTogc3RyaW5nIHtcbiAgICAgcmV0dXJuIHRoaXMuZ2V0QXBpUGF0aCgpICsgdGhpcy5nZXRVc2VyUGF0aCgpO1xuICAgfVxuXG4gICBwcml2YXRlIGdldE9BdXRoUGF0aChvQXV0aFR5cGU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgIGxldCBvQXV0aFBhdGg6IHN0cmluZztcblxuICAgICBvQXV0aFBhdGggPSB0aGlzLm9wdGlvbnMub0F1dGhQYXRoc1tvQXV0aFR5cGVdO1xuXG4gICAgIGlmIChvQXV0aFBhdGggPT0gbnVsbCkge1xuICAgICAgIG9BdXRoUGF0aCA9IGAvYXV0aC8ke29BdXRoVHlwZX1gO1xuICAgICB9XG5cbiAgICAgcmV0dXJuIG9BdXRoUGF0aDtcbiAgIH1cblxuICAgcHJpdmF0ZSBnZXRPQXV0aFVybChvQXV0aFBhdGg6IHN0cmluZywgY2FsbGJhY2tVcmw6IHN0cmluZywgd2luZG93VHlwZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgbGV0IHVybDogc3RyaW5nO1xuXG4gICAgIHVybCA9ICAgYCR7dGhpcy5vcHRpb25zLm9BdXRoQmFzZX0vJHtvQXV0aFBhdGh9YDtcbiAgICAgdXJsICs9ICBgP29tbmlhdXRoX3dpbmRvd190eXBlPSR7d2luZG93VHlwZX1gO1xuICAgICB1cmwgKz0gIGAmYXV0aF9vcmlnaW5fdXJsPSR7ZW5jb2RlVVJJQ29tcG9uZW50KGNhbGxiYWNrVXJsKX1gO1xuXG4gICAgIGlmICh0aGlzLnVzZXJUeXBlLnZhbHVlICE9IG51bGwpIHtcbiAgICAgICB1cmwgKz0gYCZyZXNvdXJjZV9jbGFzcz0ke3RoaXMudXNlclR5cGUudmFsdWUubmFtZX1gO1xuICAgICB9XG5cbiAgICAgcmV0dXJuIHVybDtcbiAgIH1cblxuXG4gIC8qKlxuICAgKlxuICAgKiBHZXQgQXV0aCBEYXRhXG4gICAqXG4gICAqL1xuXG4gICAvLyBUcnkgdG8gbG9hZCBhdXRoIGRhdGFcbiAgIHByaXZhdGUgdHJ5TG9hZEF1dGhEYXRhKCk6IHZvaWQge1xuXG4gICAgIGNvbnN0IHVzZXJUeXBlID0gdGhpcy5nZXRVc2VyVHlwZUJ5TmFtZSh0aGlzLmxvY2FsU3RvcmFnZS5nZXRJdGVtKCd1c2VyVHlwZScpKTtcblxuICAgICBpZiAodXNlclR5cGUpIHtcbiAgICAgICB0aGlzLnVzZXJUeXBlLm5leHQodXNlclR5cGUpO1xuICAgICB9XG5cbiAgICAgdGhpcy5nZXRBdXRoRGF0YUZyb21TdG9yYWdlKCk7XG5cbiAgICAgaWYgKHRoaXMuYWN0aXZhdGVkUm91dGUpIHtcbiAgICAgICB0aGlzLmdldEF1dGhEYXRhRnJvbVBhcmFtcygpO1xuICAgICB9XG5cbiAgICAgLy8gaWYgKHRoaXMuYXV0aERhdGEpIHtcbiAgICAgICAvLyAgICAgdGhpcy52YWxpZGF0ZVRva2VuKCk7XG4gICAgICAgLy8gfVxuICAgICB9XG5cbiAgICAgLy8gUGFyc2UgQXV0aCBkYXRhIGZyb20gcmVzcG9uc2VcbiAgICAgcHVibGljIGdldEF1dGhIZWFkZXJzRnJvbVJlc3BvbnNlKGRhdGE6IEh0dHBSZXNwb25zZTxhbnk+IHwgSHR0cEVycm9yUmVzcG9uc2UpOiB2b2lkIHtcbiAgICAgICBjb25zdCBoZWFkZXJzID0gZGF0YS5oZWFkZXJzO1xuXG4gICAgICAgY29uc3QgYXV0aERhdGE6IEF1dGhEYXRhID0ge1xuICAgICAgICAgYWNjZXNzVG9rZW46ICAgIGhlYWRlcnMuZ2V0KCdhY2Nlc3MtdG9rZW4nKSxcbiAgICAgICAgIGNsaWVudDogICAgICAgICBoZWFkZXJzLmdldCgnY2xpZW50JyksXG4gICAgICAgICBleHBpcnk6ICAgICAgICAgaGVhZGVycy5nZXQoJ2V4cGlyeScpLFxuICAgICAgICAgdG9rZW5UeXBlOiAgICAgIGhlYWRlcnMuZ2V0KCd0b2tlbi10eXBlJyksXG4gICAgICAgICB1aWQ6ICAgICAgICAgICAgaGVhZGVycy5nZXQoJ3VpZCcpXG4gICAgICAgfTtcblxuICAgICAgIHRoaXMuc2V0QXV0aERhdGEoYXV0aERhdGEpO1xuICAgICB9XG5cbiAgICAgLy8gUGFyc2UgQXV0aCBkYXRhIGZyb20gcG9zdCBtZXNzYWdlXG4gICAgIHByaXZhdGUgZ2V0QXV0aERhdGFGcm9tUG9zdE1lc3NhZ2UoZGF0YTogYW55KTogdm9pZCB7XG4gICAgICAgY29uc3QgYXV0aERhdGE6IEF1dGhEYXRhID0ge1xuICAgICAgICAgYWNjZXNzVG9rZW46ICAgIGRhdGFbJ2F1dGhfdG9rZW4nXSxcbiAgICAgICAgIGNsaWVudDogICAgICAgICBkYXRhWydjbGllbnRfaWQnXSxcbiAgICAgICAgIGV4cGlyeTogICAgICAgICBkYXRhWydleHBpcnknXSxcbiAgICAgICAgIHRva2VuVHlwZTogICAgICAnQmVhcmVyJyxcbiAgICAgICAgIHVpZDogICAgICAgICAgICBkYXRhWyd1aWQnXVxuICAgICAgIH07XG5cbiAgICAgICB0aGlzLnNldEF1dGhEYXRhKGF1dGhEYXRhKTtcbiAgICAgfVxuXG4gICAgIC8vIFRyeSB0byBnZXQgYXV0aCBkYXRhIGZyb20gc3RvcmFnZS5cbiAgICAgcHVibGljIGdldEF1dGhEYXRhRnJvbVN0b3JhZ2UoKTogdm9pZCB7XG5cbiAgICAgICBjb25zdCBhdXRoRGF0YTogQXV0aERhdGEgPSB7XG4gICAgICAgICBhY2Nlc3NUb2tlbjogICAgdGhpcy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYWNjZXNzVG9rZW4nKSxcbiAgICAgICAgIGNsaWVudDogICAgICAgICB0aGlzLmxvY2FsU3RvcmFnZS5nZXRJdGVtKCdjbGllbnQnKSxcbiAgICAgICAgIGV4cGlyeTogICAgICAgICB0aGlzLmxvY2FsU3RvcmFnZS5nZXRJdGVtKCdleHBpcnknKSxcbiAgICAgICAgIHRva2VuVHlwZTogICAgICB0aGlzLmxvY2FsU3RvcmFnZS5nZXRJdGVtKCd0b2tlblR5cGUnKSxcbiAgICAgICAgIHVpZDogICAgICAgICAgICB0aGlzLmxvY2FsU3RvcmFnZS5nZXRJdGVtKCd1aWQnKVxuICAgICAgIH07XG5cbiAgICAgICBpZiAodGhpcy5jaGVja0F1dGhEYXRhKGF1dGhEYXRhKSkge1xuICAgICAgICAgdGhpcy5hdXRoRGF0YS5uZXh0KGF1dGhEYXRhKTtcbiAgICAgICB9XG4gICAgIH1cblxuICAgICAvLyBUcnkgdG8gZ2V0IGF1dGggZGF0YSBmcm9tIHVybCBwYXJhbWV0ZXJzLlxuICAgICBwcml2YXRlIGdldEF1dGhEYXRhRnJvbVBhcmFtcygpOiB2b2lkIHtcbiAgICAgICB0aGlzLmFjdGl2YXRlZFJvdXRlLnF1ZXJ5UGFyYW1zLnN1YnNjcmliZShxdWVyeVBhcmFtcyA9PiB7XG4gICAgICAgICBjb25zdCBhdXRoRGF0YTogQXV0aERhdGEgPSB7XG4gICAgICAgICAgIGFjY2Vzc1Rva2VuOiAgICBxdWVyeVBhcmFtc1sndG9rZW4nXSB8fCBxdWVyeVBhcmFtc1snYXV0aF90b2tlbiddLFxuICAgICAgICAgICBjbGllbnQ6ICAgICAgICAgcXVlcnlQYXJhbXNbJ2NsaWVudF9pZCddLFxuICAgICAgICAgICBleHBpcnk6ICAgICAgICAgcXVlcnlQYXJhbXNbJ2V4cGlyeSddLFxuICAgICAgICAgICB0b2tlblR5cGU6ICAgICAgJ0JlYXJlcicsXG4gICAgICAgICAgIHVpZDogICAgICAgICAgICBxdWVyeVBhcmFtc1sndWlkJ11cbiAgICAgICAgIH07XG5cbiAgICAgICAgIGlmICh0aGlzLmNoZWNrQXV0aERhdGEoYXV0aERhdGEpKSB7XG4gICAgICAgICAgIHRoaXMuYXV0aERhdGEubmV4dChhdXRoRGF0YSk7XG4gICAgICAgICB9XG4gICAgICAgfSk7XG4gICAgIH1cblxuICAgICAvLyBUcnkgdG8gZ2V0IGF1dGggZGF0YSBmcm9tIHBhcmFtcyBvYmouXG4gICAgIHB1YmxpYyBnZXRBdXRoRGF0YUZyb21QYXJhbXNPYmoocXVlcnlQYXJhbXM6IGFueSk6IHZvaWQge1xuICAgICAgIGNvbnN0IGF1dGhEYXRhOiBBdXRoRGF0YSA9IHtcbiAgICAgICAgIGFjY2Vzc1Rva2VuOiAgICBxdWVyeVBhcmFtc1sndG9rZW4nXSB8fCBxdWVyeVBhcmFtc1snYXV0aF90b2tlbiddLFxuICAgICAgICAgY2xpZW50OiAgICAgICAgIHF1ZXJ5UGFyYW1zWydjbGllbnRfaWQnXSxcbiAgICAgICAgIGV4cGlyeTogICAgICAgICBxdWVyeVBhcmFtc1snZXhwaXJ5J10sXG4gICAgICAgICB0b2tlblR5cGU6ICAgICAgJ0JlYXJlcicsXG4gICAgICAgICB1aWQ6ICAgICAgICAgICAgcXVlcnlQYXJhbXNbJ3VpZCddXG4gICAgICAgfTtcblxuICAgICAgIGlmICh0aGlzLmNoZWNrQXV0aERhdGEoYXV0aERhdGEpKSB7XG4gICAgICAgICB0aGlzLmF1dGhEYXRhLm5leHQoYXV0aERhdGEpO1xuICAgICAgIH1cbiAgICAgfVxuXG4gIC8qKlxuICAgKlxuICAgKiBTZXQgQXV0aCBEYXRhXG4gICAqXG4gICAqL1xuXG4gICAvLyBXcml0ZSBhdXRoIGRhdGEgdG8gc3RvcmFnZVxuICAgcHJpdmF0ZSBzZXRBdXRoRGF0YShhdXRoRGF0YTogQXV0aERhdGEpOiB2b2lkIHtcbiAgICAgaWYgKHRoaXMuY2hlY2tBdXRoRGF0YShhdXRoRGF0YSkpIHtcblxuICAgICAgIHRoaXMuYXV0aERhdGEubmV4dChhdXRoRGF0YSk7XG5cbiAgICAgICB0aGlzLmxvY2FsU3RvcmFnZS5zZXRJdGVtKCdhY2Nlc3NUb2tlbicsIGF1dGhEYXRhLmFjY2Vzc1Rva2VuKTtcbiAgICAgICB0aGlzLmxvY2FsU3RvcmFnZS5zZXRJdGVtKCdjbGllbnQnLCBhdXRoRGF0YS5jbGllbnQpO1xuICAgICAgIHRoaXMubG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2V4cGlyeScsIGF1dGhEYXRhLmV4cGlyeSk7XG4gICAgICAgdGhpcy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndG9rZW5UeXBlJywgYXV0aERhdGEudG9rZW5UeXBlKTtcbiAgICAgICB0aGlzLmxvY2FsU3RvcmFnZS5zZXRJdGVtKCd1aWQnLCBhdXRoRGF0YS51aWQpO1xuXG4gICAgICAgaWYgKHRoaXMudXNlclR5cGUudmFsdWUgIT0gbnVsbCkge1xuICAgICAgICAgdGhpcy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndXNlclR5cGUnLCB0aGlzLnVzZXJUeXBlLnZhbHVlLm5hbWUpO1xuICAgICAgIH1cblxuICAgICB9XG4gICB9XG5cblxuICAvKipcbiAgICpcbiAgICogVmFsaWRhdGUgQXV0aCBEYXRhXG4gICAqXG4gICAqL1xuXG4gICAvLyBDaGVjayBpZiBhdXRoIGRhdGEgY29tcGxldGUgYW5kIGlmIHJlc3BvbnNlIHRva2VuIGlzIG5ld2VyXG4gICBwcml2YXRlIGNoZWNrQXV0aERhdGEoYXV0aERhdGE6IEF1dGhEYXRhKTogYm9vbGVhbiB7XG5cbiAgICAgaWYgKFxuICAgICAgIGF1dGhEYXRhLmFjY2Vzc1Rva2VuICE9IG51bGwgJiZcbiAgICAgICBhdXRoRGF0YS5jbGllbnQgIT0gbnVsbCAmJlxuICAgICAgIGF1dGhEYXRhLmV4cGlyeSAhPSBudWxsICYmXG4gICAgICAgYXV0aERhdGEudG9rZW5UeXBlICE9IG51bGwgJiZcbiAgICAgICBhdXRoRGF0YS51aWQgIT0gbnVsbFxuICAgICAgICkge1xuICAgICAgIGlmICh0aGlzLmF1dGhEYXRhLnZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgIHJldHVybiBhdXRoRGF0YS5leHBpcnkgPj0gdGhpcy5hdXRoRGF0YS52YWx1ZS5leHBpcnk7XG4gICAgICAgfVxuICAgICAgIHJldHVybiB0cnVlO1xuICAgICB9XG4gICAgIHJldHVybiBmYWxzZTtcbiAgIH1cblxuXG4gIC8qKlxuICAgKlxuICAgKiBPQXV0aFxuICAgKlxuICAgKi9cblxuICAgcHJpdmF0ZSByZXF1ZXN0Q3JlZGVudGlhbHNWaWFQb3N0TWVzc2FnZShhdXRoV2luZG93OiBhbnkpOiBPYnNlcnZhYmxlPGFueT4ge1xuICAgICBjb25zdCBwb2xsZXJPYnNlcnYgPSBpbnRlcnZhbCg1MDApO1xuXG4gICAgIGNvbnN0IHJlc3BvbnNlT2JzZXJ2ID0gZnJvbUV2ZW50KHRoaXMuZ2xvYmFsLCAnbWVzc2FnZScpLnBpcGUoXG4gICAgICAgcGx1Y2soJ2RhdGEnKSxcbiAgICAgICBmaWx0ZXIodGhpcy5vQXV0aFdpbmRvd1Jlc3BvbnNlRmlsdGVyKVxuICAgICAgICk7XG5cbiAgICAgcmVzcG9uc2VPYnNlcnYuc3Vic2NyaWJlKFxuICAgICAgIHRoaXMuZ2V0QXV0aERhdGFGcm9tUG9zdE1lc3NhZ2UuYmluZCh0aGlzKVxuICAgICAgICk7XG5cbiAgICAgY29uc3QgcG9sbGVyU3Vic2NyaXB0aW9uID0gcG9sbGVyT2JzZXJ2LnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgaWYgKGF1dGhXaW5kb3cuY2xvc2VkKSB7XG4gICAgICAgICBwb2xsZXJTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICB9IGVsc2Uge1xuICAgICAgICAgYXV0aFdpbmRvdy5wb3N0TWVzc2FnZSgncmVxdWVzdENyZWRlbnRpYWxzJywgJyonKTtcbiAgICAgICB9XG4gICAgIH0pO1xuXG4gICAgIHJldHVybiByZXNwb25zZU9ic2VydjtcbiAgIH1cblxuICAgcHJpdmF0ZSBvQXV0aFdpbmRvd1Jlc3BvbnNlRmlsdGVyKGRhdGE6IGFueSk6IGFueSB7XG4gICAgIGlmIChkYXRhLm1lc3NhZ2UgPT09ICdkZWxpdmVyQ3JlZGVudGlhbHMnIHx8IGRhdGEubWVzc2FnZSA9PT0gJ2F1dGhGYWlsdXJlJykge1xuICAgICAgIHJldHVybiBkYXRhO1xuICAgICB9XG4gICB9XG5cblxuICAvKipcbiAgICpcbiAgICogVXRpbGl0aWVzXG4gICAqXG4gICAqL1xuXG4gICAvLyBNYXRjaCB1c2VyIGNvbmZpZyBieSB1c2VyIGNvbmZpZyBuYW1lXG4gICBwcml2YXRlIGdldFVzZXJUeXBlQnlOYW1lKG5hbWU6IHN0cmluZyk6IFVzZXJUeXBlIHtcbiAgICAgaWYgKG5hbWUgPT0gbnVsbCB8fCB0aGlzLm9wdGlvbnMudXNlclR5cGVzID09IG51bGwpIHtcbiAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgfVxuXG4gICAgIHJldHVybiB0aGlzLm9wdGlvbnMudXNlclR5cGVzLmZpbmQoXG4gICAgICAgdXNlclR5cGUgPT4gdXNlclR5cGUubmFtZSA9PT0gbmFtZVxuICAgICAgICk7XG4gICB9XG4gfVxuIl19