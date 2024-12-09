# React Router Lazy Page

![GitHub Action Status](https://github.com/LeMarck/react-router-lazy-page/actions/workflows/test.yaml/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/LeMarck/react-router-lazy-page/badge.svg?branch=master)](https://coveralls.io/github/LeMarck/react-router-lazy-page?branch=master)

> Используется в связке с `react-router@5`
>
> В `react-router@>=6` появились `clientLoader/loader` для загрузки данных

HOC для загрузки данных на страницу

## Альтернативы

Стразу же укажу альтернативы, хотя это решение использовалось в боевом проекте (сейчас его судьба мне не известна, проект был запущен мной в 2021 году), но это приложение имеет свои особенности которые и подтолкнули меня к созданию этого решения

- [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview)
- [SWR](https://swr.vercel.app)
- [React Router](https://reactrouter.com/start/framework/data-loading)

## Предпосылки

Хотел получить механизм единой загрузки данных, чтобы избавиться от необходимости `if/else` с лоудером

Пример:

```tsx
const Page = () => {
  const {profile, isLoadingProfile} = useProfile();
  const {todoList, isLoadingToDoList} = useToDoList();

  if (isLoadingProfile) {
    return <div>Loading...</div>;
  }

  if (isLoadingToDoList) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div>{profile.name}</div>
      <ul>
        {todoList.map((todo) => (
          <li>{todo.title}</li>
        ))}
      </ul>
    </div>
  )
}
```

На момент 2020-2021 годов ещё не было React Router v6, а о существовании `swr` и `@tanstack/react-query` я не знал. Судя по npmjs.com они только появлялись и набирали популярность. Мне понравился подход Next.js с загрузкой данных через функцию `getInitialProps` (сейчас так уже не делают), который я и решил повторить

В итоге получился вот такой подход

```tsx
// pages/TodoList.tsx
const TodoList = ({
  profile,
  todoList
}) => (
  <div>
    <div>{profile.name}</div>
    <ul>
      {todoList.map((todo) => (
        <li>{todo.title}</li>
      ))}
    </ul>
  </div>
)

export async function getInitialProps() {
  const profileResponse = await fetch("https://.../profile");
  const todoListResponse = await fetch("https://.../todolist");

  return {
    props: {
      profile: await profileResponse.json(),
      todoList: await todoListResponse.json()
    }
  };
}

export default Page;

// pages/index.tsx
const TodoList = lazyPage(() => import("./TodoList"));

const App = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <TodoList />
  </Suspense>
)
```

## License

[**MIT License**](LICENSE)
