import axios from "axios";
import { useState } from "react";
import Swal from "sweetalert2";
import config from "../../config";
import { useNavigate } from "react-router-dom";

function SingIn() {
  const [user, setUser] = useState({});
  const Navigate = useNavigate();

  const handleSignIn = async () => {
    try {
      const res = await axios.post(config.apiPath + "/user/signin", user);

      if (res.data.token !== undefined) {
        localStorage.setItem("token", res.data.token);
        Swal.fire({
          icon: "success",
          title: "เข้าสู่ระบบสำเร็จ",
          text: "ยินดีต้อนรับ",
          timer: 1000, // Auto-close after 2 seconds
          showConfirmButton: false, // Hide the OK button
          willClose: () => {
            Navigate("/dashboard"); // Navigate after Swal closes
          },
        });
      }
    } catch (e) {
      if (e.response.status === 401) {
        Swal.fire({
          icon: "warning",
          title: "การลงชื่อเข้าใช้ล้มเหลว",
          text: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
          timer: 1000, // Auto-close after 2 seconds
          showConfirmButton: false, // Hide the OK button
        });
      } else {
        Swal.fire({
          title: "Error",
          text: "เกิดข้อผิดพลาดลองใหม่อีกครั้ง",
          icon: "error",
        });
      }
    }
  };
  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ background: "linear-gradient(135deg, #fff5e6, #ffd5d5)" }}
    >
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h2 className="text-2xl font-bold text-[#c59b6d] mb-4">
          เข้าสู่ระบบหลังบ้าน
        </h2>

        <div className="mb-4 relative">
          <input
            type="email"
            className="w-full px-12 py-2 bg-[#f9f7ff] border-2 border-[#c59b6d] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c59b6d] focus:border-transparent"
            placeholder="ชื่อ"
            onChange={(e) => setUser({ ...user, user: e.target.value })}
          />
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#c59b6d]">
            <i className="fas fa-user"></i>
          </span>
        </div>

        <div className="mb-4 relative">
          <input
            type="password"
            className="w-full px-12 py-2 bg-[#f9f7ff] border-2 border-[#c59b6d] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c59b6d] focus:border-transparent"
            placeholder="รหัสผ่าน"
            onChange={(e) => setUser({ ...user, pass: e.target.value })}
          />
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#c59b6d]">
            <i className="fas fa-lock"></i>
          </span>
        </div>

        <button
          className="w-full bg-[#c59b6d] text-white py-2 rounded-md hover:bg-[#b88a5a] transition"
          onClick={handleSignIn}
        >
          เข้าสู่ระบบ
        </button>
      </div>
    </div>
  );
}
export default SingIn;
