import React from 'react'
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

const Login = () => {

    const {setShowLogin, axios, setToken, navigate, fetchUser} = useAppContext()

    const [state, setState] = React.useState("login");
    const [name, setName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [phone, setPhone] = React.useState("");
    const [password, setPassword] = React.useState("");

    const onSubmitHandler = async (event)=>{
        try {
            event.preventDefault();
            const trimmedName = name.trim()
            const trimmedEmail = email.trim()
            const trimmedPhone = phone.trim()
            const trimmedPassword = password.trim()

            if (state === "register" && (!trimmedName || !trimmedEmail || !trimmedPhone || !trimmedPassword)) {
                toast.error("Please fill in all required fields.")
                return
            }

            if (state === "login" && (!trimmedEmail || !trimmedPassword)) {
                toast.error("Please fill in all required fields.")
                return
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(trimmedEmail)) {
                toast.error("Please enter a valid email address.")
                return
            }

            const phoneDigits = trimmedPhone.replace(/\D/g, '')
            if (state === "register" && (phoneDigits.length < 7 || phoneDigits.length > 15)) {
                toast.error("Please enter a valid phone number.")
                return
            }

            if (state === "register" && trimmedPassword.length < 8) {
                toast.error("Password must be at least 8 characters long.")
                return
            }

            const payload = state === "register"
                ? { name: trimmedName, email: trimmedEmail, phone: trimmedPhone, password: trimmedPassword }
                : { email: trimmedEmail, password: trimmedPassword }

            const {data} = await axios.post(`/api/user/${state}`, payload)

            if (data.success) {
                localStorage.setItem('token', data.token)
                axios.defaults.headers.common['Authorization'] = `${data.token}`
                setToken(data.token)
                const loggedInUser = await fetchUser()
                setShowLogin(false)
                navigate(loggedInUser?.role === 'admin' ? '/admin' : '/')
            }else{
                toast.error(data.message || "Unable to continue. Please try again.")
            }

        } catch (error) {
            toast.error(error.response?.data?.message || "Unable to continue. Please try again.")
        }
        
    }

  return (
    <div onClick={()=> setShowLogin(false)} className='fixed inset-0 z-100 flex items-center bg-slate-950/70 px-5 text-sm text-slate-600 backdrop-blur-sm'>

      <form onSubmit={onSubmitHandler} onClick={(e)=>e.stopPropagation()} className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-md bg-white p-8 shadow-2xl">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">DriveSphere</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950">
                  {state === "login" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="mt-2 text-slate-500">
                {state === "login"
                    ? "Sign in to manage reservations and continue planning your next drive."
                    : "Create an account to book cars, manage reservations, and track your rental history."}
              </p>
            </div>

            <div className="grid grid-cols-2 rounded-md bg-slate-100 p-1">
                <button type="button" onClick={() => setState("login")} className={`rounded-md px-4 py-2 text-sm font-semibold transition ${state === "login" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}>
                    Login
                </button>
                <button type="button" onClick={() => setState("register")} className={`rounded-md px-4 py-2 text-sm font-semibold transition ${state === "register" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}>
                    Register
                </button>
            </div>

            {state === "register" && (
                <label className="flex flex-col gap-2">
                    <span className="font-medium text-slate-700">Name</span>
                    <input onChange={(e) => setName(e.target.value)} value={name} placeholder="Enter your name" className="rounded-md border border-slate-200 px-4 py-3 outline-primary" type="text" required />
                </label>
            )}
            <label className="flex flex-col gap-2">
                <span className="font-medium text-slate-700">Email</span>
                <input onChange={(e) => setEmail(e.target.value)} value={email} placeholder="Enter your email" className="rounded-md border border-slate-200 px-4 py-3 outline-primary" type="email" required />
            </label>
            {state === "register" && (
                <label className="flex flex-col gap-2">
                    <span className="font-medium text-slate-700">Phone number</span>
                    <input onChange={(e) => setPhone(e.target.value)} value={phone} placeholder="Enter your phone number" className="rounded-md border border-slate-200 px-4 py-3 outline-primary" type="tel" required />
                </label>
            )}
            <label className="flex flex-col gap-2">
                <span className="font-medium text-slate-700">Password</span>
                <input onChange={(e) => setPassword(e.target.value)} value={password} placeholder="Enter your password" className="rounded-md border border-slate-200 px-4 py-3 outline-primary" type="password" required />
            </label>
            {state === "register" ? (
                <p className="text-slate-500">
                    Already have an account? <button type="button" onClick={() => setState("login")} className="cursor-pointer font-semibold text-primary">Log in</button>
                </p>
            ) : (
                <p className="text-slate-500">
                    New to DriveSphere? <button type="button" onClick={() => setState("register")} className="cursor-pointer font-semibold text-primary">Create account</button>
                </p>
            )}
            <button className="cursor-pointer rounded-md bg-slate-950 py-3 font-semibold text-white transition hover:bg-primary-dull">
                {state === "register" ? "Create Account" : "Login"}
            </button>
        </form>
    </div>
  )
}

export default Login
