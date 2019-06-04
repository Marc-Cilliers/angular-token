![Angular-Token](https://raw.githubusercontent.com/neroniaky/angular-token/master/docs/angular-token-logo.png)

[![npm version](https://badge.fury.io/js/angular-token.svg)](https://badge.fury.io/js/angular-token)
[![npm downloads](https://img.shields.io/npm/dt/angular-token.svg)](https://npmjs.org/angular-token)
[![Build Status](https://travis-ci.org/neroniaky/angular-token.svg?branch=master)](https://travis-ci.org/neroniaky/angular-token)
[![Angular Style Guide](https://mgechev.github.io/angular2-style-guide/images/badge.svg)](https://angular.io/styleguide)

🔑 Token based authentication service for Angular with interceptor and multi-user support. Works best with the [devise token auth](https://github.com/lynndylanhurley/devise_token_auth) gem for Rails.

👋 This library has been renamed to **Angular-Token**! Please follow the [migration guide](https://angular-token.gitbook.io/docs/migrate-to-7).

🤓 This library is a modification of the original. If you'd like to see the changes, please check below. The demo & docs still use the original codebase.

---

### Quick Links

- 🚀 View to demo on [Stackblitz](https://stackblitz.com/github/neroniaky/angular-token)
- ✨ Learn about it on the [docs site](https://angular-token.gitbook.io/docs)
- 🔧 Support us by [contributing](https://angular-token.gitbook.io/docs/contribute)

---

## Install
0. Set up a Rails with [Devise Token Auth](https://github.com/lynndylanhurley/devise_token_auth)

1. Install this modified version from its npm branch via NPM with
    ```bash
    npm install git+https://github.com/Marc-Cilliers/angular-token.git#npm
    ```

2. Import and add `AngularTokenModule` to your main module and call the 'forRoot' function with the config. Make sure you have `HttpClientModule` imported too.
    ```javascript
    import { AngularTokenModule } from 'angular-token';

    @NgModule({
        imports: [
            ...,
            HttpClientModule,
            AngularTokenModule.forRoot({
              ...
            })
        ],
        declarations: [ ... ],
        providers:    [ AngularTokenModule ],
        bootstrap:    [ ... ]
    })
    ```
## Use

3. Register your user
    ```javascript
    constructor(private tokenService: AngularTokenService) { }

    this.tokenService.registerAccount({
        login:                'example@example.org',
        password:             'secretPassword',
        passwordConfirmation: 'secretPassword'
    }).subscribe(
        res =>      console.log(res),
        error =>    console.log(error)
    );
    ```

4. Sign in your user
    ```javascript
    constructor(private tokenService: AngularTokenService) { }

    this.tokenService.signIn({
        login:    'example@example.org',
        password: 'secretPassword'
    }).subscribe(
        res =>      console.log(res),
        error =>    console.log(error)
    );
    ```

5. Now you can use HttpClient to access private resources
    ```javascript
    constructor(http: HttpClient) { }

    this.http.get('private_resource').subscribe(
        res =>      console.log(res),
        error =>    console.log(error)
    );
    ```
    
## ArbnModifications - Password Reset

1. The original resetPassword method looked like this:
    ```javascript
    constructor(private tokenService: AngularTokenService) { }

    this.tokenService.resetPassword({
        login:    'example@example.org'
    }).subscribe(
        res =>      console.log(res),
        error =>    console.log(error)
    );
    ```
    
   But because we're interfacing with **devise_token_auth**, we required it to have the extra 'redirect_url' parameter:
   ```javascript
   constructor(private tokenService: AngularTokenService) { }

   this.tokenService.resetPassword({
        login:       'example@example.org',
        redirectUrl: 'https://localhost:1234/reset-password-example'
   }).subscribe(
        res =>      console.log(res),
        error =>    console.log(error)
   );
   ```
    
2. On the route that gets redirected to, you'll need to pass some params back to the service:
   ```javascript
   ngOnInit() {
      this.route.queryParamMap.subscribe(params => {
          const paramsObj = {
            token:          params.get('token') || params.get('auth_token'),
            client_id:      params.get('client_id'),
            expiry:         params.get('expiry'),
            uid:            params.get('uid')
          };
      
          this.tokenService.getAuthDataFromParamsObj(paramsObj)
      }
   }
   ```
   
3. Once the user has filled in their form, use the changePassword method:
   ```javascript
   constructor(private tokenService: AngularTokenService) { }

   this.tokenService.changePassword({
        password:             'secretPassword',
        passwordConfirmation: 'secretPassword'
   }).subscribe(
        res =>      console.log(res),
        error =>    console.log(error)
   );
   ```

## Contributors

| [<img src="https://avatars3.githubusercontent.com/u/11535793?v=4" width="100px;"/><br /><sub>Jan-Philipp Riethmacher</sub>](https://github.com/neroniaky) | [<img src="https://avatars.githubusercontent.com/u/7848606?v=4" width="100px;"/><br /><sub>Arjen Brandenburgh</sub>](https://github.com/arjenbrandenburgh)
| :---: | :---: |

### License
The MIT License (see the [LICENSE](https://github.com/neroniaky/angular-token/blob/master/LICENSE) file for the full text)
