// import { checkESPStatus } from '../api';

export default function Navbar() {
    // const [online, setOnline] = useState(false);
  
    return (
      <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">👶 Baby Tracker</h1>
        {/* <span className={`text-sm font-semibold ${online ? 'text-green-300' : 'text-red-300'}`}>
          ESP32: {online ? 'Online' : 'Offline'}
        </span> */}
      </nav>
    );
  }
  