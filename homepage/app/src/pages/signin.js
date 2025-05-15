import axios from "axios";
import { useState } from "react";
import Swal from "sweetalert2";
import config from "../config";
import { Link, useNavigate } from "react-router-dom";
import BackOffice from "../components/BackOffice";
import "./sign.css";

function SingIn() {
  const [customer, setCustomer] = useState({});
  const Navigate = useNavigate();

  const handleSignIn = async () => {
    try {
      const res = await axios.post(config.apiPath + "/api/signin", customer);

      if (res.data.token !== undefined) {
        // Save token to local storage
        localStorage.setItem("token", res.data.token);

        // Show success message before navigating
        Swal.fire({
          icon: "success",
          title: "เข้าสู่ระบบสำเร็จ",
          text: "ยินดีต้อนรับ",
          timer: 1000, // Auto-close after 2 seconds
          showConfirmButton: false, // Hide the OK button
          willClose: () => {
            Navigate("/home"); // Navigate after Swal closes
          },
        });
      }
    } catch (e) {
      if (e.response?.status === 401) {
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
    <BackOffice>
      <div className="hold-transition login-page">
        <div class="login-box">
          <div class="card">
            <div class="card-body login-card-body">
              <p class="login-box-msg">ลงชื่อเข้าใช้</p>

              <div>
                <div class="input-group mb-3">
                  <input
                    type="email"
                    class="form-control"
                    placeholder="อีเมล"
                    onChange={(e) =>
                      setCustomer({ ...customer, email: e.target.value })
                    }
                  />
                  <div class="input-group-append">
                    <div class="input-group-text">
                      <span class="fas fa-envelope"></span>
                    </div>
                  </div>
                </div>
                <div class="input-group mb-3">
                  <input
                    type="password"
                    class="form-control"
                    placeholder="รหัสผ่าน"
                    onChange={(e) =>
                      setCustomer({ ...customer, pass: e.target.value })
                    }
                  />
                  <div class="input-group-append">
                    <div class="input-group-text">
                      <span class="fas fa-lock"></span>
                    </div>
                  </div>
                </div>
                <div class="row">
                  <div class="col-12">
                    <button
                      class="btn btn-primary btn-block"
                      onClick={handleSignIn}
                    >
                      เข้าสู่ระบบ
                    </button>
                  </div>
                  <div className="col-12 text-right">
                    <Link to="/singup" style={{ textDecoration: "none" }}>
                      สมัครสมาชิก
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BackOffice>
  );
}
export default SingIn;
