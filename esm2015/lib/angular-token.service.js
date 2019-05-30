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
export class AngularTokenService {
    /**
     * @param {?} http
     * @param {?} config
     * @param {?} platformId
     * @param {?} activatedRoute
     * @param {?} router
     */
    constructor(http, config, platformId, activatedRoute, router) {
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
                open: () => null,
                location: {
                    href: '/',
                    origin: '/'
                }
            };
            // Bad pratice, needs fixing
            this.localStorage.setItem = () => null;
            this.localStorage.getItem = () => null;
            this.localStorage.removeItem = () => null;
        }
        else {
            this.localStorage = localStorage;
        }
        /** @type {?} */
        const defaultOptions = {
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
        const mergedOptions = ((/** @type {?} */ (Object))).assign(defaultOptions, config);
        this.options = mergedOptions;
        if (this.options.apiBase === null) {
            console.warn(`[angular-token] You have not configured 'apiBase', which may result in security issues. ` +
                `Please refer to the documentation at https://github.com/neroniaky/angular-token/wiki`);
        }
        this.tryLoadAuthData();
    }
    /**
     * @return {?}
     */
    get currentUserType() {
        if (this.userType.value != null) {
            return this.userType.value.name;
        }
        else {
            return undefined;
        }
    }
    /**
     * @return {?}
     */
    get currentUserData() {
        return this.userData.value;
    }
    /**
     * @return {?}
     */
    get currentAuthData() {
        return this.authData.value;
    }
    /**
     * @return {?}
     */
    get apiBase() {
        console.warn('[angular-token] The attribute .apiBase will be removed in the next major release, please use' +
            '.tokenOptions.apiBase instead');
        return this.options.apiBase;
    }
    /**
     * @return {?}
     */
    get tokenOptions() {
        return this.options;
    }
    /**
     * @param {?} options
     * @return {?}
     */
    set tokenOptions(options) {
        this.options = ((/** @type {?} */ (Object))).assign(this.options, options);
    }
    /**
     * @return {?}
     */
    userSignedIn() {
        if (this.authData.value == null) {
            return false;
        }
        else {
            return true;
        }
    }
    /**
     * @param {?} route
     * @param {?} state
     * @return {?}
     */
    canActivate(route, state) {
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
    }
    /**
     *
     * Actions
     *
     * @param {?} registerData
     * @param {?=} additionalData
     * @return {?}
     */
    // Register request
    registerAccount(registerData, additionalData) {
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
        const login = registerData.login;
        delete registerData.login;
        registerData[this.options.loginField] = login;
        registerData.confirm_success_url = this.options.registerAccountCallback;
        return this.http.post(this.getServerPath() + this.options.registerAccountPath, registerData);
    }
    // Delete Account
    /**
     * @return {?}
     */
    deleteAccount() {
        return this.http.delete(this.getServerPath() + this.options.deleteAccountPath);
    }
    // Sign in request and set storage
    /**
     * @param {?} signInData
     * @param {?=} additionalData
     * @return {?}
     */
    signIn(signInData, additionalData) {
        this.userType.next((signInData.userType == null) ? null : this.getUserTypeByName(signInData.userType));
        /** @type {?} */
        const body = {
            [this.options.loginField]: signInData.login,
            password: signInData.password
        };
        if (additionalData !== undefined) {
            body.additionalData = additionalData;
        }
        /** @type {?} */
        const observ = this.http.post(this.getServerPath() + this.options.signInPath, body).pipe(share());
        observ.subscribe(res => this.userData.next(res.data));
        return observ;
    }
    /**
     * @param {?} oAuthType
     * @return {?}
     */
    signInOAuth(oAuthType) {
        /** @type {?} */
        const oAuthPath = this.getOAuthPath(oAuthType);
        /** @type {?} */
        const callbackUrl = `${this.global.location.origin}/${this.options.oAuthCallbackPath}`;
        /** @type {?} */
        const oAuthWindowType = this.options.oAuthWindowType;
        /** @type {?} */
        const authUrl = this.getOAuthUrl(oAuthPath, callbackUrl, oAuthWindowType);
        if (oAuthWindowType === 'newWindow') {
            /** @type {?} */
            const oAuthWindowOptions = this.options.oAuthWindowOptions;
            /** @type {?} */
            let windowOptions = '';
            if (oAuthWindowOptions) {
                for (const key in oAuthWindowOptions) {
                    if (oAuthWindowOptions.hasOwnProperty(key)) {
                        windowOptions += `,${key}=${oAuthWindowOptions[key]}`;
                    }
                }
            }
            /** @type {?} */
            const popup = window.open(authUrl, '_blank', `closebuttoncaption=Cancel${windowOptions}`);
            return this.requestCredentialsViaPostMessage(popup);
        }
        else if (oAuthWindowType === 'sameWindow') {
            this.global.location.href = authUrl;
            return undefined;
        }
        else {
            throw new Error(`Unsupported oAuthWindowType "${oAuthWindowType}"`);
        }
    }
    /**
     * @return {?}
     */
    processOAuthCallback() {
        this.getAuthDataFromParams();
    }
    // Sign out request and delete storage
    /**
     * @return {?}
     */
    signOut() {
        return this.http.delete(this.getServerPath() + this.options.signOutPath)
            // Only remove the localStorage and clear the data after the call
            .pipe(finalize(() => {
            this.localStorage.removeItem('accessToken');
            this.localStorage.removeItem('client');
            this.localStorage.removeItem('expiry');
            this.localStorage.removeItem('tokenType');
            this.localStorage.removeItem('uid');
            this.authData.next(null);
            this.userType.next(null);
            this.userData.next(null);
        }));
    }
    // Validate token request
    /**
     * @return {?}
     */
    validateToken() {
        /** @type {?} */
        const observ = this.http.get(this.getServerPath() + this.options.validateTokenPath).pipe(share());
        observ.subscribe((res) => this.userData.next(res.data), (error) => {
            if (error.status === 401 && this.options.signOutFailedValidate) {
                this.signOut();
            }
        });
        return observ;
    }
    // Update password request
    /**
     * @param {?} updatePasswordData
     * @return {?}
     */
    updatePassword(updatePasswordData) {
        if (updatePasswordData.userType != null) {
            this.userType.next(this.getUserTypeByName(updatePasswordData.userType));
        }
        /** @type {?} */
        let args;
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
        const body = args;
        return this.http.put(this.getServerPath() + this.options.updatePasswordPath, body);
    }
    // Reset password request
    /**
     * @param {?} resetPasswordData
     * @return {?}
     */
    resetPassword(resetPasswordData) {
        this.userType.next((resetPasswordData.userType == null) ? null : this.getUserTypeByName(resetPasswordData.userType));
        /** @type {?} */
        const body = {
            [this.options.loginField]: resetPasswordData.login,
            redirect_url: resetPasswordData.redirectUrl
        };
        return this.http.post(this.getServerPath() + this.options.resetPasswordPath, body);
    }
    // Change password request
    /**
     * @param {?} changePasswordData
     * @return {?}
     */
    changePassword(changePasswordData) {
        /** @type {?} */
        const body = {
            password: changePasswordData.password,
            password_confirmation: changePasswordData.passwordConfirmation
        };
        // const headers: HttpHeaders = new HttpHeaders();
        // headers.append('uid', this.currentAuthData.uid);
        // headers.append('client', this.currentAuthData.client);
        // headers.append('access-token', this.currentAuthData.accessToken);
        return this.http.put(this.getServerPath() + this.options.changePasswordPath, body);
    }
    /**
     *
     * Construct Paths / Urls
     *
     * @private
     * @return {?}
     */
    getUserPath() {
        return (this.userType.value == null) ? '' : this.userType.value.path + '/';
    }
    /**
     * @private
     * @return {?}
     */
    getApiPath() {
        /** @type {?} */
        let constructedPath = '';
        if (this.options.apiBase != null) {
            constructedPath += this.options.apiBase + '/';
        }
        if (this.options.apiPath != null) {
            constructedPath += this.options.apiPath + '/';
        }
        return constructedPath;
    }
    /**
     * @private
     * @return {?}
     */
    getServerPath() {
        return this.getApiPath() + this.getUserPath();
    }
    /**
     * @private
     * @param {?} oAuthType
     * @return {?}
     */
    getOAuthPath(oAuthType) {
        /** @type {?} */
        let oAuthPath;
        oAuthPath = this.options.oAuthPaths[oAuthType];
        if (oAuthPath == null) {
            oAuthPath = `/auth/${oAuthType}`;
        }
        return oAuthPath;
    }
    /**
     * @private
     * @param {?} oAuthPath
     * @param {?} callbackUrl
     * @param {?} windowType
     * @return {?}
     */
    getOAuthUrl(oAuthPath, callbackUrl, windowType) {
        /** @type {?} */
        let url;
        url = `${this.options.oAuthBase}/${oAuthPath}`;
        url += `?omniauth_window_type=${windowType}`;
        url += `&auth_origin_url=${encodeURIComponent(callbackUrl)}`;
        if (this.userType.value != null) {
            url += `&resource_class=${this.userType.value.name}`;
        }
        return url;
    }
    /**
     *
     * Get Auth Data
     *
     * @private
     * @return {?}
     */
    // Try to load auth data
    tryLoadAuthData() {
        /** @type {?} */
        const userType = this.getUserTypeByName(this.localStorage.getItem('userType'));
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
    }
    // Parse Auth data from response
    /**
     * @param {?} data
     * @return {?}
     */
    getAuthHeadersFromResponse(data) {
        /** @type {?} */
        const headers = data.headers;
        /** @type {?} */
        const authData = {
            accessToken: headers.get('access-token'),
            client: headers.get('client'),
            expiry: headers.get('expiry'),
            tokenType: headers.get('token-type'),
            uid: headers.get('uid')
        };
        this.setAuthData(authData);
    }
    // Parse Auth data from post message
    /**
     * @private
     * @param {?} data
     * @return {?}
     */
    getAuthDataFromPostMessage(data) {
        /** @type {?} */
        const authData = {
            accessToken: data['auth_token'],
            client: data['client_id'],
            expiry: data['expiry'],
            tokenType: 'Bearer',
            uid: data['uid']
        };
        this.setAuthData(authData);
    }
    // Try to get auth data from storage.
    /**
     * @return {?}
     */
    getAuthDataFromStorage() {
        /** @type {?} */
        const authData = {
            accessToken: this.localStorage.getItem('accessToken'),
            client: this.localStorage.getItem('client'),
            expiry: this.localStorage.getItem('expiry'),
            tokenType: this.localStorage.getItem('tokenType'),
            uid: this.localStorage.getItem('uid')
        };
        if (this.checkAuthData(authData)) {
            this.authData.next(authData);
        }
    }
    // Try to get auth data from url parameters.
    /**
     * @private
     * @return {?}
     */
    getAuthDataFromParams() {
        this.activatedRoute.queryParams.subscribe(queryParams => {
            /** @type {?} */
            const authData = {
                accessToken: queryParams['token'] || queryParams['auth_token'],
                client: queryParams['client_id'],
                expiry: queryParams['expiry'],
                tokenType: 'Bearer',
                uid: queryParams['uid']
            };
            if (this.checkAuthData(authData)) {
                this.authData.next(authData);
            }
        });
    }
    // Try to get auth data from params obj.
    /**
     * @param {?} queryParams
     * @return {?}
     */
    getAuthDataFromParamsObj(queryParams) {
        /** @type {?} */
        const authData = {
            accessToken: queryParams['token'] || queryParams['auth_token'],
            client: queryParams['client_id'],
            expiry: queryParams['expiry'],
            tokenType: 'Bearer',
            uid: queryParams['uid']
        };
        if (this.checkAuthData(authData)) {
            console.log(authData + " is correct");
            this.authData.next(authData);
        }
        else {
            console.log(authData + " is false");
        }
    }
    /**
     *
     * Set Auth Data
     *
     * @private
     * @param {?} authData
     * @return {?}
     */
    // Write auth data to storage
    setAuthData(authData) {
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
    }
    /**
     *
     * Validate Auth Data
     *
     * @private
     * @param {?} authData
     * @return {?}
     */
    // Check if auth data complete and if response token is newer
    checkAuthData(authData) {
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
    }
    /**
     *
     * OAuth
     *
     * @private
     * @param {?} authWindow
     * @return {?}
     */
    requestCredentialsViaPostMessage(authWindow) {
        /** @type {?} */
        const pollerObserv = interval(500);
        /** @type {?} */
        const responseObserv = fromEvent(this.global, 'message').pipe(pluck('data'), filter(this.oAuthWindowResponseFilter));
        responseObserv.subscribe(this.getAuthDataFromPostMessage.bind(this));
        /** @type {?} */
        const pollerSubscription = pollerObserv.subscribe(() => {
            if (authWindow.closed) {
                pollerSubscription.unsubscribe();
            }
            else {
                authWindow.postMessage('requestCredentials', '*');
            }
        });
        return responseObserv;
    }
    /**
     * @private
     * @param {?} data
     * @return {?}
     */
    oAuthWindowResponseFilter(data) {
        if (data.message === 'deliverCredentials' || data.message === 'authFailure') {
            return data;
        }
    }
    /**
     *
     * Utilities
     *
     * @private
     * @param {?} name
     * @return {?}
     */
    // Match user config by user config name
    getUserTypeByName(name) {
        if (name == null || this.options.userTypes == null) {
            return null;
        }
        return this.options.userTypes.find(userType => userType.name === name);
    }
}
AngularTokenService.decorators = [
    { type: Injectable, args: [{
                providedIn: 'root',
            },] }
];
/** @nocollapse */
AngularTokenService.ctorParameters = () => [
    { type: HttpClient },
    { type: undefined, decorators: [{ type: Inject, args: [ANGULAR_TOKEN_OPTIONS,] }] },
    { type: Object, decorators: [{ type: Inject, args: [PLATFORM_ID,] }] },
    { type: ActivatedRoute, decorators: [{ type: Optional }] },
    { type: Router, decorators: [{ type: Optional }] }
];
/** @nocollapse */ AngularTokenService.ngInjectableDef = i0.defineInjectable({ factory: function AngularTokenService_Factory() { return new AngularTokenService(i0.inject(i1.HttpClient), i0.inject(i2.ANGULAR_TOKEN_OPTIONS), i0.inject(i0.PLATFORM_ID), i0.inject(i3.ActivatedRoute, 8), i0.inject(i3.Router, 8)); }, token: AngularTokenService, providedIn: "root" });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5ndWxhci10b2tlbi5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6Im5nOi8vYW5ndWxhci10b2tlbi8iLCJzb3VyY2VzIjpbImxpYi9hbmd1bGFyLXRva2VuLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDMUUsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLEVBQTRELE1BQU0saUJBQWlCLENBQUM7QUFDbkgsT0FBTyxFQUFFLFVBQVUsRUFBbUMsTUFBTSxzQkFBc0IsQ0FBQztBQUNuRixPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUVuRCxPQUFPLEVBQWMsU0FBUyxFQUFFLFFBQVEsRUFBRSxlQUFlLEVBQUUsTUFBTSxNQUFNLENBQUM7QUFDeEUsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBRWhFLE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxNQUFNLHVCQUF1QixDQUFDOzs7OztBQW9COUQsTUFBTSxPQUFPLG1CQUFtQjs7Ozs7Ozs7SUF3QzlCLFlBQ1UsSUFBZ0IsRUFDTyxNQUFXLEVBQ2IsVUFBa0IsRUFDM0IsY0FBOEIsRUFDOUIsTUFBYztRQUoxQixTQUFJLEdBQUosSUFBSSxDQUFZO1FBRUssZUFBVSxHQUFWLFVBQVUsQ0FBUTtRQUMzQixtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7UUFDOUIsV0FBTSxHQUFOLE1BQU0sQ0FBUTtRQVo3QixhQUFRLEdBQThCLElBQUksZUFBZSxDQUFXLElBQUksQ0FBQyxDQUFDO1FBQzFFLGFBQVEsR0FBOEIsSUFBSSxlQUFlLENBQVcsSUFBSSxDQUFDLENBQUM7UUFDMUUsYUFBUSxHQUE4QixJQUFJLGVBQWUsQ0FBVyxJQUFJLENBQUMsQ0FBQztRQUd6RSxpQkFBWSxH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QUNMLFVBQVUsQ0FBQyxXQUFXLENBQUMsb0JBQW9CLEVBQUUsR0FBRyxDQUFDLENBQUM7YUFDbkQ7UUFDSCxDQUFDLENBQUM7UUFFRixPQUFPLGNBQWMsQ0FBQztJQUN4QixDQUFDOzs7Ozs7SUFFTyx5QkFBeUIsQ0FBQyxJQUFTO1FBQ3pDLElBQUksSUFBSSxDQUFDLE9BQU8sS0FBSyxvQkFBb0IsSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLGFBQWEsRUFBRTtZQUMzRSxPQUFPLElBQUksQ0FBQztTQUNiO0lBQ0gsQ0FBQzs7Ozs7Ozs7OztJQVVPLGlCQUFpQixDQUFDLElBQVk7UUFDcEMsSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxJQUFJLElBQUksRUFBRTtZQUNsRCxPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQ2hDLFFBQVEsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUksS0FBSyxJQUFJLENBQ2pDLENBQUM7SUFDTixDQUFDOzs7WUFwbUJILFVBQVUsU0FBQztnQkFDVixVQUFVLEVBQUUsTUFBTTthQUNuQjs7OztZQXpCUSxVQUFVOzRDQW9FZCxNQUFNLFNBQUMscUJBQXFCO1lBQ1ksTUFBTSx1QkFBOUMsTUFBTSxTQUFDLFdBQVc7WUF0RWQsY0FBYyx1QkF1RWxCLFFBQVE7WUF2RVksTUFBTSx1QkF3RTFCLFFBQVE7Ozs7Ozs7O0lBYlgsc0NBQXFDOztJQUNyQyx1Q0FBaUY7O0lBQ2pGLHVDQUFpRjs7SUFDakYsdUNBQWlGOzs7OztJQUNqRixxQ0FBNkI7Ozs7O0lBRTdCLDJDQUF5Qzs7Ozs7SUFHdkMsbUNBQXdCOzs7OztJQUV4Qix5Q0FBK0M7Ozs7O0lBQy9DLDZDQUFrRDs7Ozs7SUFDbEQscUNBQWtDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0YWJsZSwgT3B0aW9uYWwsIEluamVjdCwgUExBVEZPUk1fSUQgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IEFjdGl2YXRlZFJvdXRlLCBSb3V0ZXIsIENhbkFjdGl2YXRlLCBBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90LCBSb3V0ZXJTdGF0ZVNuYXBzaG90IH0gZnJvbSAnQGFuZ3VsYXIvcm91dGVyJztcbmltcG9ydCB7IEh0dHBDbGllbnQsIEh0dHBSZXNwb25zZSwgSHR0cEVycm9yUmVzcG9uc2UgfSBmcm9tICdAYW5ndWxhci9jb21tb24vaHR0cCc7XG5pbXBvcnQgeyBpc1BsYXRmb3JtU2VydmVyIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcblxuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgZnJvbUV2ZW50LCBpbnRlcnZhbCwgQmVoYXZpb3JTdWJqZWN0IH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBwbHVjaywgZmlsdGVyLCBzaGFyZSwgZmluYWxpemUgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbmltcG9ydCB7IEFOR1VMQVJfVE9LRU5fT1BUSU9OUyB9IGZyb20gJy4vYW5ndWxhci10b2tlbi50b2tlbic7XG5cbmltcG9ydCB7XG4gIFNpZ25JbkRhdGEsXG4gIFJlZ2lzdGVyRGF0YSxcbiAgVXBkYXRlUGFzc3dvcmREYXRhLFxuICBSZXNldFBhc3N3b3JkRGF0YSxcbiAgQ2hhbmdlUGFzc3dvcmREYXRhLFxuXG4gIFVzZXJUeXBlLFxuICBVc2VyRGF0YSxcbiAgQXV0aERhdGEsXG4gIEFwaVJlc3BvbnNlLFxuXG4gIEFuZ3VsYXJUb2tlbk9wdGlvbnNcbn0gZnJvbSAnLi9hbmd1bGFyLXRva2VuLm1vZGVsJztcblxuQEluamVjdGFibGUoe1xuICBwcm92aWRlZEluOiAncm9vdCcsXG59KVxuZXhwb3J0IGNsYXNzIEFuZ3VsYXJUb2tlblNlcnZpY2UgaW1wbGVtZW50cyBDYW5BY3RpdmF0ZSB7XG5cbiAgZ2V0IGN1cnJlbnRVc2VyVHlwZSgpOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLnVzZXJUeXBlLnZhbHVlICE9IG51bGwpIHtcbiAgICAgIHJldHVybiB0aGlzLnVzZXJUeXBlLnZhbHVlLm5hbWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICB9XG5cbiAgZ2V0IGN1cnJlbnRVc2VyRGF0YSgpOiBVc2VyRGF0YSB7XG4gICAgcmV0dXJuIHRoaXMudXNlckRhdGEudmFsdWU7XG4gIH1cblxuICBnZXQgY3VycmVudEF1dGhEYXRhKCk6IEF1dGhEYXRhIHtcbiAgICByZXR1cm4gdGhpcy5hdXRoRGF0YS52YWx1ZTtcbiAgfVxuXG4gIGdldCBhcGlCYXNlKCk6IHN0cmluZyB7XG4gICAgY29uc29sZS53YXJuKCdbYW5ndWxhci10b2tlbl0gVGhlIGF0dHJpYnV0ZSAuYXBpQmFzZSB3aWxsIGJlIHJlbW92ZWQgaW4gdGhlIG5leHQgbWFqb3IgcmVsZWFzZSwgcGxlYXNlIHVzZScgK1xuICAgICcudG9rZW5PcHRpb25zLmFwaUJhc2UgaW5zdGVhZCcpO1xuICAgIHJldHVybiB0aGlzLm9wdGlvbnMuYXBpQmFzZTtcbiAgfVxuXG4gIGdldCB0b2tlbk9wdGlvbnMoKTogQW5ndWxhclRva2VuT3B0aW9ucyB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucztcbiAgfVxuXG4gIHNldCB0b2tlbk9wdGlvbnMob3B0aW9uczogQW5ndWxhclRva2VuT3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9ICg8YW55Pk9iamVjdCkuYXNzaWduKHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG4gIH1cblxuICBwcml2YXRlIG9wdGlvbnM6IEFuZ3VsYXJUb2tlbk9wdGlvbnM7XG4gIHB1YmxpYyB1c2VyVHlwZTogQmVoYXZpb3JTdWJqZWN0PFVzZXJUeXBlPiA9IG5ldyBCZWhhdmlvclN1YmplY3Q8VXNlclR5cGU+KG51bGwpO1xuICBwdWJsaWMgYXV0aERhdGE6IEJlaGF2aW9yU3ViamVjdDxBdXRoRGF0YT4gPSBuZXcgQmVoYXZpb3JTdWJqZWN0PEF1dGhEYXRhPihudWxsKTtcbiAgcHVibGljIHVzZXJEYXRhOiBCZWhhdmlvclN1YmplY3Q8VXNlckRhdGE+ID0gbmV3IEJlaGF2aW9yU3ViamVjdDxVc2VyRGF0YT4obnVsbCk7XG4gIHByaXZhdGUgZ2xvYmFsOiBXaW5kb3cgfCBhbnk7XG5cbiAgcHJpdmF0ZSBsb2NhbFN0b3JhZ2U6IFN0b3JhZ2UgfCBhbnkgPSB7fTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIGh0dHA6IEh0dHBDbGllbnQsXG4gICAgQEluamVjdChBTkdVTEFSX1RPS0VOX09QVElPTlMpIGNvbmZpZzogYW55LFxuICAgIEBJbmplY3QoUExBVEZPUk1fSUQpIHByaXZhdGUgcGxhdGZvcm1JZDogT2JqZWN0LFxuICAgIEBPcHRpb25hbCgpIHByaXZhdGUgYWN0aXZhdGVkUm91dGU6IEFjdGl2YXRlZFJvdXRlLFxuICAgIEBPcHRpb25hbCgpIHByaXZhdGUgcm91dGVyOiBSb3V0ZXJcbiAgKSB7XG4gICAgdGhpcy5nbG9iYWwgPSAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpID8gd2luZG93IDoge307XG5cbiAgICBpZiAoaXNQbGF0Zm9ybVNlcnZlcih0aGlzLnBsYXRmb3JtSWQpKSB7XG5cbiAgICAgIC8vIEJhZCBwcmF0aWNlLCBuZWVkcyBmaXhpbmdcbiAgICAgIHRoaXMuZ2xvYmFsID0ge1xuICAgICAgICBvcGVuOiAoKTogdm9pZCA9PiBudWxsLFxuICAgICAgICBsb2NhdGlvbjoge1xuICAgICAgICAgIGhyZWY6ICcvJyxcbiAgICAgICAgICBvcmlnaW46ICcvJ1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICAvLyBCYWQgcHJhdGljZSwgbmVlZHMgZml4aW5nXG4gICAgICB0aGlzLmxvY2FsU3RvcmFnZS5zZXRJdGVtID0gKCk6IHZvaWQgPT4gbnVsbDtcbiAgICAgIHRoaXMubG9jYWxTdG9yYWdlLmdldEl0ZW0gPSAoKTogdm9pZCA9PiBudWxsO1xuICAgICAgdGhpcy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSA9ICgpOiB2b2lkID0+IG51bGw7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubG9jYWxTdG9yYWdlID0gbG9jYWxTdG9yYWdlO1xuICAgIH1cblxuICAgIGNvbnN0IGRlZmF1bHRPcHRpb25zOiBBbmd1bGFyVG9rZW5PcHRpb25zID0ge1xuICAgICAgYXBpUGF0aDogICAgICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICBhcGlCYXNlOiAgICAgICAgICAgICAgICAgICAgbnVsbCxcblxuICAgICAgc2lnbkluUGF0aDogICAgICAgICAgICAgICAgICdhdXRoL3NpZ25faW4nLFxuICAgICAgc2lnbkluUmVkaXJlY3Q6ICAgICAgICAgICAgIG51bGwsXG4gICAgICBzaWduSW5TdG9yZWRVcmxTdG9yYWdlS2V5OiAgbnVsbCxcblxuICAgICAgc2lnbk91dFBhdGg6ICAgICAgICAgICAgICAgICdhdXRoL3NpZ25fb3V0JyxcbiAgICAgIHZhbGlkYXRlVG9rZW5QYXRoOiAgICAgICAgICAnYXV0aC92YWxpZGF0ZV90b2tlbicsXG4gICAgICBzaWduT3V0RmFpbGVkVmFsaWRhdGU6ICAgICAgZmFsc2UsXG5cbiAgICAgIHJlZ2lzdGVyQWNjb3VudFBhdGg6ICAgICAgICAnYXV0aCcsXG4gICAgICBkZWxldGVBY2NvdW50UGF0aDogICAgICAgICAgJ2F1dGgnLFxuICAgICAgcmVnaXN0ZXJBY2NvdW50Q2FsbGJhY2s6ICAgIHRoaXMuZ2xvYmFsLmxvY2F0aW9uLmhyZWYsXG5cbiAgICAgIHVwZGF0ZVBhc3N3b3JkUGF0aDogICAgICAgICAnYXV0aCcsXG4gICAgICBjaGFuZ2VQYXNzd29yZFBhdGg6ICAgICAgICAgJ2F1dGgvcGFzc3dvcmQnLFxuXG4gICAgICByZXNldFBhc3N3b3JkUGF0aDogICAgICAgICAgJ2F1dGgvcGFzc3dvcmQnLFxuICAgICAgcmVzZXRQYXNzd29yZENhbGxiYWNrOiAgICAgIHRoaXMuZ2xvYmFsLmxvY2F0aW9uLmhyZWYsXG5cbiAgICAgIHVzZXJUeXBlczogICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgbG9naW5GaWVsZDogICAgICAgICAgICAgICAgICdlbWFpbCcsXG5cbiAgICAgIG9BdXRoQmFzZTogICAgICAgICAgICAgICAgICB0aGlzLmdsb2JhbC5sb2NhdGlvbi5vcmlnaW4sXG4gICAgICBvQXV0aFBhdGhzOiB7XG4gICAgICAgIGdpdGh1YjogICAgICAgICAgICAgICAgICAgJ2F1dGgvZ2l0aHViJ1xuICAgICAgfSxcbiAgICAgIG9BdXRoQ2FsbGJhY2tQYXRoOiAgICAgICAgICAnb2F1dGhfY2FsbGJhY2snLFxuICAgICAgb0F1dGhXaW5kb3dUeXBlOiAgICAgICAgICAgICduZXdXaW5kb3cnLFxuICAgICAgb0F1dGhXaW5kb3dPcHRpb25zOiAgICAgICAgIG51bGwsXG4gICAgfTtcblxuICAgIGNvbnN0IG1lcmdlZE9wdGlvbnMgPSAoPGFueT5PYmplY3QpLmFzc2lnbihkZWZhdWx0T3B0aW9ucywgY29uZmlnKTtcbiAgICB0aGlzLm9wdGlvbnMgPSBtZXJnZWRPcHRpb25zO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5hcGlCYXNlID09PSBudWxsKSB7XG4gICAgICBjb25zb2xlLndhcm4oYFthbmd1bGFyLXRva2VuXSBZb3UgaGF2ZSBub3QgY29uZmlndXJlZCAnYXBpQmFzZScsIHdoaWNoIG1heSByZXN1bHQgaW4gc2VjdXJpdHkgaXNzdWVzLiBgICtcbiAgICAgICAgICAgICAgICAgICBgUGxlYXNlIHJlZmVyIHRvIHRoZSBkb2N1bWVudGF0aW9uIGF0IGh0dHBzOi8vZ2l0aHViLmNvbS9uZXJvbmlha3kvYW5ndWxhci10b2tlbi93aWtpYCk7XG4gICAgfVxuXG4gICAgdGhpcy50cnlMb2FkQXV0aERhdGEoKTtcbiAgfVxuXG4gIHVzZXJTaWduZWRJbigpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5hdXRoRGF0YS52YWx1ZSA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGNhbkFjdGl2YXRlKHJvdXRlOiBBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90LCBzdGF0ZTogUm91dGVyU3RhdGVTbmFwc2hvdCk6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLnVzZXJTaWduZWRJbigpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gU3RvcmUgY3VycmVudCBsb2NhdGlvbiBpbiBzdG9yYWdlICh1c2VmdWxsIGZvciByZWRpcmVjdGlvbiBhZnRlciBzaWduaW5nIGluKVxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5zaWduSW5TdG9yZWRVcmxTdG9yYWdlS2V5KSB7XG4gICAgICAgIHRoaXMubG9jYWxTdG9yYWdlLnNldEl0ZW0oXG4gICAgICAgICAgdGhpcy5vcHRpb25zLnNpZ25JblN0b3JlZFVybFN0b3JhZ2VLZXksXG4gICAgICAgICAgc3RhdGUudXJsXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIC8vIFJlZGlyZWN0IHVzZXIgdG8gc2lnbiBpbiBpZiBzaWduSW5SZWRpcmVjdCBpcyBzZXRcbiAgICAgIGlmICh0aGlzLnJvdXRlciAmJiB0aGlzLm9wdGlvbnMuc2lnbkluUmVkaXJlY3QpIHtcbiAgICAgICAgdGhpcy5yb3V0ZXIubmF2aWdhdGUoW3RoaXMub3B0aW9ucy5zaWduSW5SZWRpcmVjdF0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cblxuICAvKipcbiAgICpcbiAgICogQWN0aW9uc1xuICAgKlxuICAgKi9cblxuICAvLyBSZWdpc3RlciByZXF1ZXN0XG4gIHJlZ2lzdGVyQWNjb3VudChyZWdpc3RlckRhdGE6IFJlZ2lzdGVyRGF0YSwgYWRkaXRpb25hbERhdGE/OiBhbnkpOiBPYnNlcnZhYmxlPEFwaVJlc3BvbnNlPiB7XG5cbiAgICByZWdpc3RlckRhdGEgPSBPYmplY3QuYXNzaWduKHt9LCByZWdpc3RlckRhdGEpO1xuXG4gICAgaWYgKHJlZ2lzdGVyRGF0YS51c2VyVHlwZSA9PSBudWxsKSB7XG4gICAgICB0aGlzLnVzZXJUeXBlLm5leHQobnVsbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudXNlclR5cGUubmV4dCh0aGlzLmdldFVzZXJUeXBlQnlOYW1lKHJlZ2lzdGVyRGF0YS51c2VyVHlwZSkpO1xuICAgICAgZGVsZXRlIHJlZ2lzdGVyRGF0YS51c2VyVHlwZTtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICByZWdpc3RlckRhdGEucGFzc3dvcmRfY29uZmlybWF0aW9uID09IG51bGwgJiZcbiAgICAgIHJlZ2lzdGVyRGF0YS5wYXNzd29yZENvbmZpcm1hdGlvbiAhPSBudWxsXG4gICAgKSB7XG4gICAgICByZWdpc3RlckRhdGEucGFzc3dvcmRfY29uZmlybWF0aW9uID0gcmVnaXN0ZXJEYXRhLnBhc3N3b3JkQ29uZmlybWF0aW9uO1xuICAgICAgZGVsZXRlIHJlZ2lzdGVyRGF0YS5wYXNzd29yZENvbmZpcm1hdGlvbjtcbiAgICB9XG5cbiAgICBpZiAoYWRkaXRpb25hbERhdGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmVnaXN0ZXJEYXRhLmFkZGl0aW9uYWxEYXRhID0gYWRkaXRpb25hbERhdGE7XG4gICAgfVxuXG4gICAgY29uc3QgbG9naW4gPSByZWdpc3RlckRhdGEubG9naW47XG4gICAgZGVsZXRlIHJlZ2lzdGVyRGF0YS5sb2dpbjtcbiAgICByZWdpc3RlckRhdGFbdGhpcy5vcHRpb25zLmxvZ2luRmllbGRdID0gbG9naW47XG5cbiAgICByZWdpc3RlckRhdGEuY29uZmlybV9zdWNjZXNzX3VybCA9IHRoaXMub3B0aW9ucy5yZWdpc3RlckFjY291bnRDYWxsYmFjaztcblxuICAgIHJldHVybiB0aGlzLmh0dHAucG9zdDxBcGlSZXNwb25zZT4oXG4gICAgICB0aGlzLmdldFNlcnZlclBhdGgoKSArIHRoaXMub3B0aW9ucy5yZWdpc3RlckFjY291bnRQYXRoLCByZWdpc3RlckRhdGFcbiAgICApO1xuICB9XG5cbiAgLy8gRGVsZXRlIEFjY291bnRcbiAgZGVsZXRlQWNjb3VudCgpOiBPYnNlcnZhYmxlPEFwaVJlc3BvbnNlPiB7XG4gICAgcmV0dXJuIHRoaXMuaHR0cC5kZWxldGU8QXBpUmVzcG9uc2U+KHRoaXMuZ2V0U2VydmVyUGF0aCgpICsgdGhpcy5vcHRpb25zLmRlbGV0ZUFjY291bnRQYXRoKTtcbiAgfVxuXG4gIC8vIFNpZ24gaW4gcmVxdWVzdCBhbmQgc2V0IHN0b3JhZ2VcbiAgc2lnbkluKHNpZ25JbkRhdGE6IFNpZ25JbkRhdGEsIGFkZGl0aW9uYWxEYXRhPzogYW55KTogT2JzZXJ2YWJsZTxBcGlSZXNwb25zZT4ge1xuICAgIHRoaXMudXNlclR5cGUubmV4dCgoc2lnbkluRGF0YS51c2VyVHlwZSA9PSBudWxsKSA/IG51bGwgOiB0aGlzLmdldFVzZXJUeXBlQnlOYW1lKHNpZ25JbkRhdGEudXNlclR5cGUpKTtcblxuICAgIGNvbnN0IGJvZHkgPSB7XG4gICAgICBbdGhpcy5vcHRpb25zLmxvZ2luRmllbGRdOiBzaWduSW5EYXRhLmxvZ2luLFxuICAgICAgcGFzc3dvcmQ6IHNpZ25JbkRhdGEucGFzc3dvcmRcbiAgICB9O1xuXG4gICAgaWYgKGFkZGl0aW9uYWxEYXRhICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGJvZHkuYWRkaXRpb25hbERhdGEgPSBhZGRpdGlvbmFsRGF0YTtcbiAgICB9XG5cbiAgICBjb25zdCBvYnNlcnYgPSB0aGlzLmh0dHAucG9zdDxBcGlSZXNwb25zZT4oXG4gICAgICB0aGlzLmdldFNlcnZlclBhdGgoKSArIHRoaXMub3B0aW9ucy5zaWduSW5QYXRoLCBib2R5XG4gICAgKS5waXBlKHNoYXJlKCkpO1xuXG4gICAgb2JzZXJ2LnN1YnNjcmliZShyZXMgPT4gdGhpcy51c2VyRGF0YS5uZXh0KHJlcy5kYXRhKSk7XG5cbiAgICByZXR1cm4gb2JzZXJ2O1xuICB9XG5cbiAgc2lnbkluT0F1dGgob0F1dGhUeXBlOiBzdHJpbmcpIHtcblxuICAgIGNvbnN0IG9BdXRoUGF0aDogc3RyaW5nID0gdGhpcy5nZXRPQXV0aFBhdGgob0F1dGhUeXBlKTtcbiAgICBjb25zdCBjYWxsYmFja1VybCA9IGAke3RoaXMuZ2xvYmFsLmxvY2F0aW9uLm9yaWdpbn0vJHt0aGlzLm9wdGlvbnMub0F1dGhDYWxsYmFja1BhdGh9YDtcbiAgICBjb25zdCBvQXV0aFdpbmRvd1R5cGU6IHN0cmluZyA9IHRoaXMub3B0aW9ucy5vQXV0aFdpbmRvd1R5cGU7XG4gICAgY29uc3QgYXV0aFVybDogc3RyaW5nID0gdGhpcy5nZXRPQXV0aFVybChvQXV0aFBhdGgsIGNhbGxiYWNrVXJsLCBvQXV0aFdpbmRvd1R5cGUpO1xuXG4gICAgaWYgKG9BdXRoV2luZG93VHlwZSA9PT0gJ25ld1dpbmRvdycpIHtcbiAgICAgIGNvbnN0IG9BdXRoV2luZG93T3B0aW9ucyA9IHRoaXMub3B0aW9ucy5vQXV0aFdpbmRvd09wdGlvbnM7XG4gICAgICBsZXQgd2luZG93T3B0aW9ucyA9ICcnO1xuXG4gICAgICBpZiAob0F1dGhXaW5kb3dPcHRpb25zKSB7XG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIG9BdXRoV2luZG93T3B0aW9ucykge1xuICAgICAgICAgIGlmIChvQXV0aFdpbmRvd09wdGlvbnMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICB3aW5kb3dPcHRpb25zICs9IGAsJHtrZXl9PSR7b0F1dGhXaW5kb3dPcHRpb25zW2tleV19YDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgcG9wdXAgPSB3aW5kb3cub3BlbihcbiAgICAgICAgICBhdXRoVXJsLFxuICAgICAgICAgICdfYmxhbmsnLFxuICAgICAgICAgIGBjbG9zZWJ1dHRvbmNhcHRpb249Q2FuY2VsJHt3aW5kb3dPcHRpb25zfWBcbiAgICAgICk7XG4gICAgICByZXR1cm4gdGhpcy5yZXF1ZXN0Q3JlZGVudGlhbHNWaWFQb3N0TWVzc2FnZShwb3B1cCk7XG4gICAgfSBlbHNlIGlmIChvQXV0aFdpbmRvd1R5cGUgPT09ICdzYW1lV2luZG93Jykge1xuICAgICAgdGhpcy5nbG9iYWwubG9jYXRpb24uaHJlZiA9IGF1dGhVcmw7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuc3VwcG9ydGVkIG9BdXRoV2luZG93VHlwZSBcIiR7b0F1dGhXaW5kb3dUeXBlfVwiYCk7XG4gICAgfVxuICB9XG5cbiAgcHJvY2Vzc09BdXRoQ2FsbGJhY2soKTogdm9pZCB7XG4gICAgdGhpcy5nZXRBdXRoRGF0YUZyb21QYXJhbXMoKTtcbiAgfVxuXG4gIC8vIFNpZ24gb3V0IHJlcXVlc3QgYW5kIGRlbGV0ZSBzdG9yYWdlXG4gIHNpZ25PdXQoKTogT2JzZXJ2YWJsZTxBcGlSZXNwb25zZT4ge1xuICAgIHJldHVybiB0aGlzLmh0dHAuZGVsZXRlPEFwaVJlc3BvbnNlPih0aGlzLmdldFNlcnZlclBhdGgoKSArIHRoaXMub3B0aW9ucy5zaWduT3V0UGF0aClcbiAgICAgIC8vIE9ubHkgcmVtb3ZlIHRoZSBsb2NhbFN0b3JhZ2UgYW5kIGNsZWFyIHRoZSBkYXRhIGFmdGVyIHRoZSBjYWxsXG4gICAgICAucGlwZShcbiAgICAgICAgZmluYWxpemUoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnYWNjZXNzVG9rZW4nKTtcbiAgICAgICAgICAgIHRoaXMubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2NsaWVudCcpO1xuICAgICAgICAgICAgdGhpcy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnZXhwaXJ5Jyk7XG4gICAgICAgICAgICB0aGlzLmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCd0b2tlblR5cGUnKTtcbiAgICAgICAgICAgIHRoaXMubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3VpZCcpO1xuXG4gICAgICAgICAgICB0aGlzLmF1dGhEYXRhLm5leHQobnVsbCk7XG4gICAgICAgICAgICB0aGlzLnVzZXJUeXBlLm5leHQobnVsbCk7XG4gICAgICAgICAgICB0aGlzLnVzZXJEYXRhLm5leHQobnVsbCk7XG4gICAgICAgICAgfVxuICAgICAgICApXG4gICAgICApO1xuICB9XG5cbiAgLy8gVmFsaWRhdGUgdG9rZW4gcmVxdWVzdFxuICB2YWxpZGF0ZVRva2VuKCk6IE9ic2VydmFibGU8QXBpUmVzcG9uc2U+IHtcbiAgICBjb25zdCBvYnNlcnYgPSB0aGlzLmh0dHAuZ2V0PEFwaVJlc3BvbnNlPihcbiAgICAgIHRoaXMuZ2V0U2VydmVyUGF0aCgpICsgdGhpcy5vcHRpb25zLnZhbGlkYXRlVG9rZW5QYXRoXG4gICAgKS5waXBlKHNoYXJlKCkpO1xuXG4gICAgb2JzZXJ2LnN1YnNjcmliZShcbiAgICAgIChyZXMpID0+IHRoaXMudXNlckRhdGEubmV4dChyZXMuZGF0YSksXG4gICAgICAoZXJyb3IpID0+IHtcbiAgICAgICAgaWYgKGVycm9yLnN0YXR1cyA9PT0gNDAxICYmIHRoaXMub3B0aW9ucy5zaWduT3V0RmFpbGVkVmFsaWRhdGUpIHtcbiAgICAgICAgICB0aGlzLnNpZ25PdXQoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIG9ic2VydjtcbiAgfVxuXG4gIC8vIFVwZGF0ZSBwYXNzd29yZCByZXF1ZXN0XG4gIHVwZGF0ZVBhc3N3b3JkKHVwZGF0ZVBhc3N3b3JkRGF0YTogVXBkYXRlUGFzc3dvcmREYXRhKTogT2JzZXJ2YWJsZTxBcGlSZXNwb25zZT4ge1xuXG4gICAgaWYgKHVwZGF0ZVBhc3N3b3JkRGF0YS51c2VyVHlwZSAhPSBudWxsKSB7XG4gICAgICB0aGlzLnVzZXJUeXBlLm5leHQodGhpcy5nZXRVc2VyVHlwZUJ5TmFtZSh1cGRhdGVQYXNzd29yZERhdGEudXNlclR5cGUpKTtcbiAgICB9XG5cbiAgICBsZXQgYXJnczogYW55O1xuXG4gICAgaWYgKHVwZGF0ZVBhc3N3b3JkRGF0YS5wYXNzd29yZEN1cnJlbnQgPT0gbnVsbCkge1xuICAgICAgYXJncyA9IHtcbiAgICAgICAgcGFzc3dvcmQ6ICAgICAgICAgICAgICAgdXBkYXRlUGFzc3dvcmREYXRhLnBhc3N3b3JkLFxuICAgICAgICBwYXNzd29yZF9jb25maXJtYXRpb246ICB1cGRhdGVQYXNzd29yZERhdGEucGFzc3dvcmRDb25maXJtYXRpb25cbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGFyZ3MgPSB7XG4gICAgICAgIGN1cnJlbnRfcGFzc3dvcmQ6ICAgICAgIHVwZGF0ZVBhc3N3b3JkRGF0YS5wYXNzd29yZEN1cnJlbnQsXG4gICAgICAgIHBhc3N3b3JkOiAgICAgICAgICAgICAgIHVwZGF0ZVBhc3N3b3JkRGF0YS5wYXNzd29yZCxcbiAgICAgICAgcGFzc3dvcmRfY29uZmlybWF0aW9uOiAgdXBkYXRlUGFzc3dvcmREYXRhLnBhc3N3b3JkQ29uZmlybWF0aW9uXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmICh1cGRhdGVQYXNzd29yZERhdGEucmVzZXRQYXNzd29yZFRva2VuKSB7XG4gICAgICBhcmdzLnJlc2V0X3Bhc3N3b3JkX3Rva2VuID0gdXBkYXRlUGFzc3dvcmREYXRhLnJlc2V0UGFzc3dvcmRUb2tlbjtcbiAgICB9XG5cbiAgICBjb25zdCBib2R5ID0gYXJncztcbiAgICByZXR1cm4gdGhpcy5odHRwLnB1dDxBcGlSZXNwb25zZT4odGhpcy5nZXRTZXJ2ZXJQYXRoKCkgKyB0aGlzLm9wdGlvbnMudXBkYXRlUGFzc3dvcmRQYXRoLCBib2R5KTtcbiAgfVxuXG4gIC8vIFJlc2V0IHBhc3N3b3JkIHJlcXVlc3RcbiAgcmVzZXRQYXNzd29yZChyZXNldFBhc3N3b3JkRGF0YTogUmVzZXRQYXNzd29yZERhdGEpOiBPYnNlcnZhYmxlPEFwaVJlc3BvbnNlPiB7XG5cbiAgICB0aGlzLnVzZXJUeXBlLm5leHQoXG4gICAgICAocmVzZXRQYXNzd29yZERhdGEudXNlclR5cGUgPT0gbnVsbCkgPyBudWxsIDogdGhpcy5nZXRVc2VyVHlwZUJ5TmFtZShyZXNldFBhc3N3b3JkRGF0YS51c2VyVHlwZSlcbiAgICApO1xuXG4gICAgY29uc3QgYm9keSA9IHtcbiAgICAgIFt0aGlzLm9wdGlvbnMubG9naW5GaWVsZF06IHJlc2V0UGFzc3dvcmREYXRhLmxvZ2luLFxuICAgICAgcmVkaXJlY3RfdXJsOiByZXNldFBhc3N3b3JkRGF0YS5yZWRpcmVjdFVybFxuICAgIH07XG5cbiAgICByZXR1cm4gdGhpcy5odHRwLnBvc3Q8QXBpUmVzcG9uc2U+KHRoaXMuZ2V0U2VydmVyUGF0aCgpICsgdGhpcy5vcHRpb25zLnJlc2V0UGFzc3dvcmRQYXRoLCBib2R5KTtcbiAgfVxuXG4gIC8vIENoYW5nZSBwYXNzd29yZCByZXF1ZXN0XG4gIGNoYW5nZVBhc3N3b3JkKGNoYW5nZVBhc3N3b3JkRGF0YTogQ2hhbmdlUGFzc3dvcmREYXRhKTogT2JzZXJ2YWJsZTxBcGlSZXNwb25zZT4ge1xuXG4gICAgY29uc3QgYm9keSA9IHtcbiAgICAgIHBhc3N3b3JkOiBjaGFuZ2VQYXNzd29yZERhdGEucGFzc3dvcmQsXG4gICAgICBwYXNzd29yZF9jb25maXJtYXRpb246IGNoYW5nZVBhc3N3b3JkRGF0YS5wYXNzd29yZENvbmZpcm1hdGlvblxuICAgIH07XG5cbiAgICAvLyBjb25zdCBoZWFkZXJzOiBIdHRwSGVhZGVycyA9IG5ldyBIdHRwSGVhZGVycygpO1xuICAgIC8vIGhlYWRlcnMuYXBwZW5kKCd1aWQnLCB0aGlzLmN1cnJlbnRBdXRoRGF0YS51aWQpO1xuICAgIC8vIGhlYWRlcnMuYXBwZW5kKCdjbGllbnQnLCB0aGlzLmN1cnJlbnRBdXRoRGF0YS5jbGllbnQpO1xuICAgIC8vIGhlYWRlcnMuYXBwZW5kKCdhY2Nlc3MtdG9rZW4nLCB0aGlzLmN1cnJlbnRBdXRoRGF0YS5hY2Nlc3NUb2tlbik7XG5cbiAgICByZXR1cm4gdGhpcy5odHRwLnB1dDxBcGlSZXNwb25zZT4odGhpcy5nZXRTZXJ2ZXJQYXRoKCkgKyB0aGlzLm9wdGlvbnMuY2hhbmdlUGFzc3dvcmRQYXRoLCBib2R5KTtcbiAgfVxuXG5cbiAgLyoqXG4gICAqXG4gICAqIENvbnN0cnVjdCBQYXRocyAvIFVybHNcbiAgICpcbiAgICovXG5cbiAgIHByaXZhdGUgZ2V0VXNlclBhdGgoKTogc3RyaW5nIHtcbiAgICAgcmV0dXJuICh0aGlzLnVzZXJUeXBlLnZhbHVlID09IG51bGwpID8gJycgOiB0aGlzLnVzZXJUeXBlLnZhbHVlLnBhdGggKyAnLyc7XG4gICB9XG5cbiAgIHByaXZhdGUgZ2V0QXBpUGF0aCgpOiBzdHJpbmcge1xuICAgICBsZXQgY29uc3RydWN0ZWRQYXRoID0gJyc7XG5cbiAgICAgaWYgKHRoaXMub3B0aW9ucy5hcGlCYXNlICE9IG51bGwpIHtcbiAgICAgICBjb25zdHJ1Y3RlZFBhdGggKz0gdGhpcy5vcHRpb25zLmFwaUJhc2UgKyAnLyc7XG4gICAgIH1cblxuICAgICBpZiAodGhpcy5vcHRpb25zLmFwaVBhdGggIT0gbnVsbCkge1xuICAgICAgIGNvbnN0cnVjdGVkUGF0aCArPSB0aGlzLm9wdGlvbnMuYXBpUGF0aCArICcvJztcbiAgICAgfVxuXG4gICAgIHJldHVybiBjb25zdHJ1Y3RlZFBhdGg7XG4gICB9XG5cbiAgIHByaXZhdGUgZ2V0U2VydmVyUGF0aCgpOiBzdHJpbmcge1xuICAgICByZXR1cm4gdGhpcy5nZXRBcGlQYXRoKCkgKyB0aGlzLmdldFVzZXJQYXRoKCk7XG4gICB9XG5cbiAgIHByaXZhdGUgZ2V0T0F1dGhQYXRoKG9BdXRoVHlwZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgbGV0IG9BdXRoUGF0aDogc3RyaW5nO1xuXG4gICAgIG9BdXRoUGF0aCA9IHRoaXMub3B0aW9ucy5vQXV0aFBhdGhzW29BdXRoVHlwZV07XG5cbiAgICAgaWYgKG9BdXRoUGF0aCA9PSBudWxsKSB7XG4gICAgICAgb0F1dGhQYXRoID0gYC9hdXRoLyR7b0F1dGhUeXBlfWA7XG4gICAgIH1cblxuICAgICByZXR1cm4gb0F1dGhQYXRoO1xuICAgfVxuXG4gICBwcml2YXRlIGdldE9BdXRoVXJsKG9BdXRoUGF0aDogc3RyaW5nLCBjYWxsYmFja1VybDogc3RyaW5nLCB3aW5kb3dUeXBlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICBsZXQgdXJsOiBzdHJpbmc7XG5cbiAgICAgdXJsID0gICBgJHt0aGlzLm9wdGlvbnMub0F1dGhCYXNlfS8ke29BdXRoUGF0aH1gO1xuICAgICB1cmwgKz0gIGA/b21uaWF1dGhfd2luZG93X3R5cGU9JHt3aW5kb3dUeXBlfWA7XG4gICAgIHVybCArPSAgYCZhdXRoX29yaWdpbl91cmw9JHtlbmNvZGVVUklDb21wb25lbnQoY2FsbGJhY2tVcmwpfWA7XG5cbiAgICAgaWYgKHRoaXMudXNlclR5cGUudmFsdWUgIT0gbnVsbCkge1xuICAgICAgIHVybCArPSBgJnJlc291cmNlX2NsYXNzPSR7dGhpcy51c2VyVHlwZS52YWx1ZS5uYW1lfWA7XG4gICAgIH1cblxuICAgICByZXR1cm4gdXJsO1xuICAgfVxuXG5cbiAgLyoqXG4gICAqXG4gICAqIEdldCBBdXRoIERhdGFcbiAgICpcbiAgICovXG5cbiAgIC8vIFRyeSB0byBsb2FkIGF1dGggZGF0YVxuICAgcHJpdmF0ZSB0cnlMb2FkQXV0aERhdGEoKTogdm9pZCB7XG5cbiAgICAgY29uc3QgdXNlclR5cGUgPSB0aGlzLmdldFVzZXJUeXBlQnlOYW1lKHRoaXMubG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3VzZXJUeXBlJykpO1xuXG4gICAgIGlmICh1c2VyVHlwZSkge1xuICAgICAgIHRoaXMudXNlclR5cGUubmV4dCh1c2VyVHlwZSk7XG4gICAgIH1cblxuICAgICB0aGlzLmdldEF1dGhEYXRhRnJvbVN0b3JhZ2UoKTtcblxuICAgICBpZiAodGhpcy5hY3RpdmF0ZWRSb3V0ZSkge1xuICAgICAgIHRoaXMuZ2V0QXV0aERhdGFGcm9tUGFyYW1zKCk7XG4gICAgIH1cblxuICAgICAvLyBpZiAodGhpcy5hdXRoRGF0YSkge1xuICAgICAgIC8vICAgICB0aGlzLnZhbGlkYXRlVG9rZW4oKTtcbiAgICAgICAvLyB9XG4gICAgIH1cblxuICAgICAvLyBQYXJzZSBBdXRoIGRhdGEgZnJvbSByZXNwb25zZVxuICAgICBwdWJsaWMgZ2V0QXV0aEhlYWRlcnNGcm9tUmVzcG9uc2UoZGF0YTogSHR0cFJlc3BvbnNlPGFueT4gfCBIdHRwRXJyb3JSZXNwb25zZSk6IHZvaWQge1xuICAgICAgIGNvbnN0IGhlYWRlcnMgPSBkYXRhLmhlYWRlcnM7XG5cbiAgICAgICBjb25zdCBhdXRoRGF0YTogQXV0aERhdGEgPSB7XG4gICAgICAgICBhY2Nlc3NUb2tlbjogICAgaGVhZGVycy5nZXQoJ2FjY2Vzcy10b2tlbicpLFxuICAgICAgICAgY2xpZW50OiAgICAgICAgIGhlYWRlcnMuZ2V0KCdjbGllbnQnKSxcbiAgICAgICAgIGV4cGlyeTogICAgICAgICBoZWFkZXJzLmdldCgnZXhwaXJ5JyksXG4gICAgICAgICB0b2tlblR5cGU6ICAgICAgaGVhZGVycy5nZXQoJ3Rva2VuLXR5cGUnKSxcbiAgICAgICAgIHVpZDogICAgICAgICAgICBoZWFkZXJzLmdldCgndWlkJylcbiAgICAgICB9O1xuXG4gICAgICAgdGhpcy5zZXRBdXRoRGF0YShhdXRoRGF0YSk7XG4gICAgIH1cblxuICAgICAvLyBQYXJzZSBBdXRoIGRhdGEgZnJvbSBwb3N0IG1lc3NhZ2VcbiAgICAgcHJpdmF0ZSBnZXRBdXRoRGF0YUZyb21Qb3N0TWVzc2FnZShkYXRhOiBhbnkpOiB2b2lkIHtcbiAgICAgICBjb25zdCBhdXRoRGF0YTogQXV0aERhdGEgPSB7XG4gICAgICAgICBhY2Nlc3NUb2tlbjogICAgZGF0YVsnYXV0aF90b2tlbiddLFxuICAgICAgICAgY2xpZW50OiAgICAgICAgIGRhdGFbJ2NsaWVudF9pZCddLFxuICAgICAgICAgZXhwaXJ5OiAgICAgICAgIGRhdGFbJ2V4cGlyeSddLFxuICAgICAgICAgdG9rZW5UeXBlOiAgICAgICdCZWFyZXInLFxuICAgICAgICAgdWlkOiAgICAgICAgICAgIGRhdGFbJ3VpZCddXG4gICAgICAgfTtcblxuICAgICAgIHRoaXMuc2V0QXV0aERhdGEoYXV0aERhdGEpO1xuICAgICB9XG5cbiAgICAgLy8gVHJ5IHRvIGdldCBhdXRoIGRhdGEgZnJvbSBzdG9yYWdlLlxuICAgICBwdWJsaWMgZ2V0QXV0aERhdGFGcm9tU3RvcmFnZSgpOiB2b2lkIHtcblxuICAgICAgIGNvbnN0IGF1dGhEYXRhOiBBdXRoRGF0YSA9IHtcbiAgICAgICAgIGFjY2Vzc1Rva2VuOiAgICB0aGlzLmxvY2FsU3RvcmFnZS5nZXRJdGVtKCdhY2Nlc3NUb2tlbicpLFxuICAgICAgICAgY2xpZW50OiAgICAgICAgIHRoaXMubG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2NsaWVudCcpLFxuICAgICAgICAgZXhwaXJ5OiAgICAgICAgIHRoaXMubG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2V4cGlyeScpLFxuICAgICAgICAgdG9rZW5UeXBlOiAgICAgIHRoaXMubG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3Rva2VuVHlwZScpLFxuICAgICAgICAgdWlkOiAgICAgICAgICAgIHRoaXMubG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3VpZCcpXG4gICAgICAgfTtcblxuICAgICAgIGlmICh0aGlzLmNoZWNrQXV0aERhdGEoYXV0aERhdGEpKSB7XG4gICAgICAgICB0aGlzLmF1dGhEYXRhLm5leHQoYXV0aERhdGEpO1xuICAgICAgIH1cbiAgICAgfVxuXG4gICAgIC8vIFRyeSB0byBnZXQgYXV0aCBkYXRhIGZyb20gdXJsIHBhcmFtZXRlcnMuXG4gICAgIHByaXZhdGUgZ2V0QXV0aERhdGFGcm9tUGFyYW1zKCk6IHZvaWQge1xuICAgICAgIHRoaXMuYWN0aXZhdGVkUm91dGUucXVlcnlQYXJhbXMuc3Vic2NyaWJlKHF1ZXJ5UGFyYW1zID0+IHtcbiAgICAgICAgIGNvbnN0IGF1dGhEYXRhOiBBdXRoRGF0YSA9IHtcbiAgICAgICAgICAgYWNjZXNzVG9rZW46ICAgIHF1ZXJ5UGFyYW1zWyd0b2tlbiddIHx8IHF1ZXJ5UGFyYW1zWydhdXRoX3Rva2VuJ10sXG4gICAgICAgICAgIGNsaWVudDogICAgICAgICBxdWVyeVBhcmFtc1snY2xpZW50X2lkJ10sXG4gICAgICAgICAgIGV4cGlyeTogICAgICAgICBxdWVyeVBhcmFtc1snZXhwaXJ5J10sXG4gICAgICAgICAgIHRva2VuVHlwZTogICAgICAnQmVhcmVyJyxcbiAgICAgICAgICAgdWlkOiAgICAgICAgICAgIHF1ZXJ5UGFyYW1zWyd1aWQnXVxuICAgICAgICAgfTtcblxuICAgICAgICAgaWYgKHRoaXMuY2hlY2tBdXRoRGF0YShhdXRoRGF0YSkpIHtcbiAgICAgICAgICAgdGhpcy5hdXRoRGF0YS5uZXh0KGF1dGhEYXRhKTtcbiAgICAgICAgIH1cbiAgICAgICB9KTtcbiAgICAgfVxuXG4gICAgIC8vIFRyeSB0byBnZXQgYXV0aCBkYXRhIGZyb20gcGFyYW1zIG9iai5cbiAgICAgcHVibGljIGdldEF1dGhEYXRhRnJvbVBhcmFtc09iaihxdWVyeVBhcmFtczogYW55KTogdm9pZCB7XG4gICAgICAgY29uc3QgYXV0aERhdGE6IEF1dGhEYXRhID0ge1xuICAgICAgICAgYWNjZXNzVG9rZW46ICAgIHF1ZXJ5UGFyYW1zWyd0b2tlbiddIHx8IHF1ZXJ5UGFyYW1zWydhdXRoX3Rva2VuJ10sXG4gICAgICAgICBjbGllbnQ6ICAgICAgICAgcXVlcnlQYXJhbXNbJ2NsaWVudF9pZCddLFxuICAgICAgICAgZXhwaXJ5OiAgICAgICAgIHF1ZXJ5UGFyYW1zWydleHBpcnknXSxcbiAgICAgICAgIHRva2VuVHlwZTogICAgICAnQmVhcmVyJyxcbiAgICAgICAgIHVpZDogICAgICAgICAgICBxdWVyeVBhcmFtc1sndWlkJ11cbiAgICAgICB9O1xuXG4gICAgICAgaWYgKHRoaXMuY2hlY2tBdXRoRGF0YShhdXRoRGF0YSkpIHtcbiAgICAgICAgIGNvbnNvbGUubG9nKCBhdXRoRGF0YSArIFwiIGlzIGNvcnJlY3RcIik7XG4gICAgICAgICB0aGlzLmF1dGhEYXRhLm5leHQoYXV0aERhdGEpO1xuICAgICAgIH0gZWxzZSB7XG4gICAgICAgICBjb25zb2xlLmxvZyggYXV0aERhdGEgKyBcIiBpcyBmYWxzZVwiKTtcbiAgICAgICB9XG4gICAgIH1cblxuICAvKipcbiAgICpcbiAgICogU2V0IEF1dGggRGF0YVxuICAgKlxuICAgKi9cblxuICAgLy8gV3JpdGUgYXV0aCBkYXRhIHRvIHN0b3JhZ2VcbiAgIHByaXZhdGUgc2V0QXV0aERhdGEoYXV0aERhdGE6IEF1dGhEYXRhKTogdm9pZCB7XG4gICAgIGlmICh0aGlzLmNoZWNrQXV0aERhdGEoYXV0aERhdGEpKSB7XG5cbiAgICAgICB0aGlzLmF1dGhEYXRhLm5leHQoYXV0aERhdGEpO1xuXG4gICAgICAgdGhpcy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnYWNjZXNzVG9rZW4nLCBhdXRoRGF0YS5hY2Nlc3NUb2tlbik7XG4gICAgICAgdGhpcy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnY2xpZW50JywgYXV0aERhdGEuY2xpZW50KTtcbiAgICAgICB0aGlzLmxvY2FsU3RvcmFnZS5zZXRJdGVtKCdleHBpcnknLCBhdXRoRGF0YS5leHBpcnkpO1xuICAgICAgIHRoaXMubG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3Rva2VuVHlwZScsIGF1dGhEYXRhLnRva2VuVHlwZSk7XG4gICAgICAgdGhpcy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndWlkJywgYXV0aERhdGEudWlkKTtcblxuICAgICAgIGlmICh0aGlzLnVzZXJUeXBlLnZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgIHRoaXMubG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3VzZXJUeXBlJywgdGhpcy51c2VyVHlwZS52YWx1ZS5uYW1lKTtcbiAgICAgICB9XG5cbiAgICAgfVxuICAgfVxuXG5cbiAgLyoqXG4gICAqXG4gICAqIFZhbGlkYXRlIEF1dGggRGF0YVxuICAgKlxuICAgKi9cblxuICAgLy8gQ2hlY2sgaWYgYXV0aCBkYXRhIGNvbXBsZXRlIGFuZCBpZiByZXNwb25zZSB0b2tlbiBpcyBuZXdlclxuICAgcHJpdmF0ZSBjaGVja0F1dGhEYXRhKGF1dGhEYXRhOiBBdXRoRGF0YSk6IGJvb2xlYW4ge1xuXG4gICAgIGlmIChcbiAgICAgICBhdXRoRGF0YS5hY2Nlc3NUb2tlbiAhPSBudWxsICYmXG4gICAgICAgYXV0aERhdGEuY2xpZW50ICE9IG51bGwgJiZcbiAgICAgICBhdXRoRGF0YS5leHBpcnkgIT0gbnVsbCAmJlxuICAgICAgIGF1dGhEYXRhLnRva2VuVHlwZSAhPSBudWxsICYmXG4gICAgICAgYXV0aERhdGEudWlkICE9IG51bGxcbiAgICAgICApIHtcbiAgICAgICBpZiAodGhpcy5hdXRoRGF0YS52YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICByZXR1cm4gYXV0aERhdGEuZXhwaXJ5ID49IHRoaXMuYXV0aERhdGEudmFsdWUuZXhwaXJ5O1xuICAgICAgIH1cbiAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgfVxuICAgICByZXR1cm4gZmFsc2U7XG4gICB9XG5cblxuICAvKipcbiAgICpcbiAgICogT0F1dGhcbiAgICpcbiAgICovXG5cbiAgIHByaXZhdGUgcmVxdWVzdENyZWRlbnRpYWxzVmlhUG9zdE1lc3NhZ2UoYXV0aFdpbmRvdzogYW55KTogT2JzZXJ2YWJsZTxhbnk+IHtcbiAgICAgY29uc3QgcG9sbGVyT2JzZXJ2ID0gaW50ZXJ2YWwoNTAwKTtcblxuICAgICBjb25zdCByZXNwb25zZU9ic2VydiA9IGZyb21FdmVudCh0aGlzLmdsb2JhbCwgJ21lc3NhZ2UnKS5waXBlKFxuICAgICAgIHBsdWNrKCdkYXRhJyksXG4gICAgICAgZmlsdGVyKHRoaXMub0F1dGhXaW5kb3dSZXNwb25zZUZpbHRlcilcbiAgICAgICApO1xuXG4gICAgIHJlc3BvbnNlT2JzZXJ2LnN1YnNjcmliZShcbiAgICAgICB0aGlzLmdldEF1dGhEYXRhRnJvbVBvc3RNZXNzYWdlLmJpbmQodGhpcylcbiAgICAgICApO1xuXG4gICAgIGNvbnN0IHBvbGxlclN1YnNjcmlwdGlvbiA9IHBvbGxlck9ic2Vydi5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgIGlmIChhdXRoV2luZG93LmNsb3NlZCkge1xuICAgICAgICAgcG9sbGVyU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgfSBlbHNlIHtcbiAgICAgICAgIGF1dGhXaW5kb3cucG9zdE1lc3NhZ2UoJ3JlcXVlc3RDcmVkZW50aWFscycsICcqJyk7XG4gICAgICAgfVxuICAgICB9KTtcblxuICAgICByZXR1cm4gcmVzcG9uc2VPYnNlcnY7XG4gICB9XG5cbiAgIHByaXZhdGUgb0F1dGhXaW5kb3dSZXNwb25zZUZpbHRlcihkYXRhOiBhbnkpOiBhbnkge1xuICAgICBpZiAoZGF0YS5tZXNzYWdlID09PSAnZGVsaXZlckNyZWRlbnRpYWxzJyB8fCBkYXRhLm1lc3NhZ2UgPT09ICdhdXRoRmFpbHVyZScpIHtcbiAgICAgICByZXR1cm4gZGF0YTtcbiAgICAgfVxuICAgfVxuXG5cbiAgLyoqXG4gICAqXG4gICAqIFV0aWxpdGllc1xuICAgKlxuICAgKi9cblxuICAgLy8gTWF0Y2ggdXNlciBjb25maWcgYnkgdXNlciBjb25maWcgbmFtZVxuICAgcHJpdmF0ZSBnZXRVc2VyVHlwZUJ5TmFtZShuYW1lOiBzdHJpbmcpOiBVc2VyVHlwZSB7XG4gICAgIGlmIChuYW1lID09IG51bGwgfHwgdGhpcy5vcHRpb25zLnVzZXJUeXBlcyA9PSBudWxsKSB7XG4gICAgICAgcmV0dXJuIG51bGw7XG4gICAgIH1cblxuICAgICByZXR1cm4gdGhpcy5vcHRpb25zLnVzZXJUeXBlcy5maW5kKFxuICAgICAgIHVzZXJUeXBlID0+IHVzZXJUeXBlLm5hbWUgPT09IG5hbWVcbiAgICAgICApO1xuICAgfVxuIH1cbiJdfQ==