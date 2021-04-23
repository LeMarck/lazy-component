# React Lazy Page

[![Build Status](https://www.travis-ci.com/LeMarck/lazy-page.svg?branch=master)](https://www.travis-ci.com/LeMarck/lazy-page)
[![Coverage Status](https://coveralls.io/repos/github/LeMarck/lazy-page/badge.svg?branch=master)](https://coveralls.io/github/LeMarck/lazy-page?branch=master)

[React.lazy](https://ru.reactjs.org/docs/code-splitting.html) alternative for pages with data fetching

## Page

**Page** is a [React Component](https://reactjs.org/docs/components-and-props.html) exported from a `.js`, `.jsx`, `.ts`
, or `.tsx`

**pages/About.page.tsx**

```tsx
const About = () => <div>About</div>;

export default About;
```

## Data Fetching

**pages/Blog.page.tsx**

```tsx

const Blog = ({ posts }) => <ul>
  {posts.map((post) => (
    <li>{post.title}</li>
  ))}
</ul>;

export async function getStaticProps() {
  const res = await fetch('https://.../posts')
  const posts = await res.json()

  return { props: { posts } };
}

export default Blog
```

## Usage

**App.tsx**

```tsx
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { lazyPage } from 'react-lazy-page';
import { Suspense } from 'react';

export const App = (): JSX.Element => <BrowserRouter>
  <Suspense fallback={<div>Loading...</div>}>
    <Switch>
      <Route path={'/about'} component={lazyPage(() => import('./pages/About.page'))} exact/>
      <Route path={'/blog'} component={lazyPage(() => import('./pages/Blog.page'))} exact/>
    </Switch>
  </Suspense>
</BrowserRouter>;
```

## Inspiration

* [Next.js – Pages](https://nextjs.org/docs/basic-features/pages)
* [Next.js – Data Fetching](https://nextjs.org/docs/basic-features/data-fetching)

## License

[MIT License](LICENSE)
