# Lazy Component

[![Build Status](https://www.travis-ci.com/LeMarck/lazy-page.svg?branch=master)](https://www.travis-ci.com/LeMarck/lazy-page)
[![Coverage Status](https://coveralls.io/repos/github/LeMarck/lazy-page/badge.svg?branch=master)](https://coveralls.io/github/LeMarck/lazy-page?branch=master)

Create a lazy loading page wrapper

## Config

**components/Loading.component.tsx**

```tsx
export const LoadingComponent = (): JSX.Element =>
  <div>Loading...</div>;
```

**components/Error.component.tsx**

```tsx
export const ErrorComponent = ({ error }: { error: Error }): JSX.Element =>
  <div>
    <h1>{error.name}</h1>
    <p>{error.message}</p>
  </div>
```

**utils/lazyPage.tsx**

```tsx
import { LoadingComponent, ErrorComponent } from 'src/components';
import { createLazyPage } from 'lazy-page';

export const lazyPage = createLazyPage({
  LoadingComponent,
  ErrorComponent
});
```

## Usage

**App.tsx**

```tsx
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { lazyPage } from './utils';

export const App = (): JSX.Element => <BrowserRouter>
  <Switch>
    <Route path={'/'} component={lazyPage(() => import('/pages/MainPage'))} exact/>
    <Route path={'/about'} component={lazyPage(() => import('/pages/AboutPage'))} exact/>
  </Switch>
</BrowserRouter>;
```

## License

[MIT License](LICENSE)
