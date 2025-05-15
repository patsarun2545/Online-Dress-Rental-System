import axios from "axios";
import { useState } from "react";
import Swal from "sweetalert2";
import config from "../config"; // Make sure this has your API base URL
import { Link, useNavigate } from "react-router-dom";
import BackOffice from "../components/BackOffice";
import "./sign.css";

function SignUp() {
  const Navigate = useNavigate();
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    pass: "",
    phone: "",
    address: "",
  });

  const handleSignup = async () => {
    // Validation
    const { name, email, pass, phone, address } = customer;

    // Check if any field is empty
    if (!name || !email || !pass || !phone || !address) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกข้อมูล",
        text: "กรุณากรอกข้อมูลให้ครบทุกช่อง",
        timer: 1000, // Auto-close after 2 seconds
        showConfirmButton: false, // Hide the OK button
      });
      return;
    }

    // Email validation: must include '@'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Swal.fire({
        icon: "warning",
        title: "อีเมลไม่ถูกต้อง",
        text: "กรุณากรอกที่อยู่อีเมลที่ถูกต้อง @",
        timer: 1000, // Auto-close after 2 seconds
        showConfirmButton: false, // Hide the OK button
      });
      return;
    }

    // Password validation: at least one letter and one number
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(pass)) {
      Swal.fire({
        icon: "warning",
        title: "รหัสผ่านไม่ปลอดภัย",
        text: "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษรวมตัวเลข",
        timer: 1000, // Auto-close after 2 seconds
        showConfirmButton: false, // Hide the OK button
      });
      return;
    }

    // Phone validation: exactly 10 digits
    if (!/^\d{10}$/.test(phone)) {
      Swal.fire({
        icon: "warning",
        title: "เบอร์โทรศัพท์ไม่ถูกต้อง",
        text: "หมายเลขโทรศัพท์ต้องเป็นตัวเลข 10 หลักเท่านั้น",
        timer: 1000, // Auto-close after 2 seconds
        showConfirmButton: false, // Hide the OK button
      });
      return;
    }

    try {
      const res = await axios.post(config.apiPath + "/api/customers", customer);

      Swal.fire({
        icon: "success",
        title: "สมัครสมาชิกสำเร็จ",
        text: `ยินดีต้อนรับ , ${res.data.name}`,
        timer: 1000,
        showConfirmButton: false,
        willClose: () => {
          Navigate("/singin");
        },
      });

      setCustomer({ name: "", email: "", pass: "", phone: "", address: "" });
    } catch (error) {
      console.error("Error:", error);

      // ตรวจสอบว่าข้อผิดพลาดเกิดจากอีเมลซ้ำหรือไม่
      if (error.response?.data?.error === "อีเมลนี้ถูกใช้ไปแล้ว") {
        Swal.fire({
          icon: "warning",
          title: "อีเมลนี้ถูกใช้ไปแล้ว",
          text: "กรุณาใช้อีเมลอื่น",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.error || "มีบางอย่างผิดพลาด!",
        });
      }
    }
  };

  return (
    <BackOffice>
      <div className="hold-transition login-page">
        <div className="login-box">
          <div className="card">
            <div className="card-body login-card-body">
              <p className="login-box-msg">สมัครสมาชิก</p>

              <div>
                {/* Name Input */}
                <div className="input-group mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="ชื่อจริง"
                    value={customer.name}
                    onChange={(e) =>
                      setCustomer({ ...customer, name: e.target.value })
                    }
                  />
                  <div className="input-group-append">
                    <div className="input-group-text">
                      <span className="fas fa-user"></span>
                    </div>
                  </div>
                </div>

                {/* Email Input */}
                <div className="input-group mb-3">
                  <input
                    type="email"
                    className="form-control"
                    placeholder="อีเมล"
                    value={customer.email}
                    onChange={(e) =>
                      setCustomer({ ...customer, email: e.target.value })
                    }
                  />
                  <div className="input-group-append">
                    <div className="input-group-text">
                      <span className="fas fa-envelope"></span>
                    </div>
                  </div>
                </div>

                {/* Password Input */}
                <div className="input-group mb-3">
                  <input
                    type="password"
                    className="form-control"
                    placeholder="รหัสผ่าน"
                    value={customer.pass}
                    onChange={(e) =>
                      setCustomer({ ...customer, pass: e.target.value })
                    }
                  />
                  <div className="input-group-append">
                    <div className="input-group-text">
                      <span className="fas fa-lock"></span>
                    </div>
                  </div>
                </div>

                {/* Phone Input */}
                <div className="input-group mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="หมายเลขโทรศัพท์"
                    value={customer.phone}
                    onChange={(e) =>
                      setCustomer({ ...customer, phone: e.target.value })
                    }
                  />
                  <div className="input-group-append">
                    <div className="input-group-text">
                      <span className="fas fa-phone"></span>
                    </div>
                  </div>
                </div>

                {/* Address Input */}
                <div className="input-group mb-3">
                  <textarea
                    className="form-control"
                    placeholder="ที่อยู่"
                    value={customer.address}
                    onChange={(e) =>
                      setCustomer({ ...customer, address: e.target.value })
                    }
                    rows="3" // กำหนดจำนวนบรรทัดที่แสดง (สามารถปรับได้)
                    style={{ resize: "none" }} // ป้องกันการยืดขยายแบบ manual โดยผู้ใช้
                  ></textarea>
                  <div className="input-group-append">
                    <div className="input-group-text">
                      <span className="fas fa-home"></span>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-6">
                    <button
                      className="btn btn-primary btn-block"
                      onClick={handleSignup}
                    >
                      สมัครสมาชิก
                    </button>
                  </div>
                  <div className="col-6 text-right">
                    <Link to="/singin" style={{ textDecoration: "none" }}>
                      เข้าสู่ระบบ
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

export default SignUp;
