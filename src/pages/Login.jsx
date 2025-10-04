import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else navigate("/dashboard");
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border rounded px-3 py-2 mb-3 w-full"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border rounded px-3 py-2 mb-3 w-full"
      />
      <button
        onClick={handleLogin}
        disabled={loading}
        className="bg-purple-600 text-white px-4 py-2 rounded w-full"
      >
        {loading ? "Loading..." : "Login"}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      <p className="mt-3 text-sm text-gray-600 text-center">
        Don’t have an account?{" "}
        <a href="/register" className="text-purple-600 hover:underline">
          Register
        </a>
      </p>
    </div>
  );
}
