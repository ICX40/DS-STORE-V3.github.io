import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";

function App() {
  return (
    <header style={{ display: "flex", justifyContent: "space-between", padding: "20px" }}>
      <h1>DS STORE V2</h1>
      
      <div>
        {/* هذا الجزء يظهر فقط إذا كان الشخص غير مسجل دخول */}
        <SignedOut>
          <SignInButton mode="modal">
            <button className="btn">تسجيل الدخول</button>
          </SignInButton>
        </SignedOut>

        {/* هذا الجزء يظهر فقط إذا كان الشخص مسجل دخول بالفعل */}
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  );
}

export default App;