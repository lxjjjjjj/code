# React Hooks的限制 
* 只在最顶层使用 Hook
* 只在 React 函数中调用 Hook

```
const myStates = [];
let stateCalls = -1;

function useMyState(defaultValue) {
  stateCalls += 1
  const stateId = stateCalls;

  if (myStates[stateId]) {
    return myStates[stateId];
  }

  const setMyValue = (value) => {
    myStates[stateId][0] = value;
    renderWithMyHook();
  };
  const tuple = [defaultValue, setMyValue];
  myStates[stateId] = tuple;
  return tuple
}


function App() {
  const [number, setNumber] = useMyState(5);
  const [error, setError] = useMyState(null);

  const handlePlus = () => {
    if (number >= 0) {
      setError(null);
    }
    setNumber(number + 1);
  }

  const handleMinus = () => {
    if (number < 1) {
      setError('Number should be positive.');
    } else {
      setNumber(number - 1);
    }
  }

  return (
    <div className="App">
      <label style={{ height: 30, display: 'block', color: 'red' }}>{error}</label>
      <div>
        <button onClick={handleMinus}>minus</button>
        <span style={{ margin: 30 }}>{number}</span>
        <button onClick={handlePlus}>plus</button>
      </div>
    </div>
  );
}

function renderWithMyHook() {
   stateCalls = -1;
    ReactDOM.render(
      <App />,
    document.getElementById('root')
  );
}

renderWithMyHook()
```