import { useEffect, useState } from "react";
import BackOffice from "../../components/BackOffice";
import MyModal from "../../components/MyModal";
import Swal from "sweetalert2";
import axios from "axios";
import config from "../../config";

function Customer() {
  const [customer, setCustomer] = useState({}); // CREATE, UPDATE
  const [customers, setCustomers] = useState([]); // SHOW

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSave = async () => {
    try {
      let res;

      if (customer.id === undefined) {
        res = await axios.post(
          config.apiPath + "/api/customers",
          customer,
          config.headers()
        );
      } else {
        res = await axios.put(
          config.apiPath + `/api/customers/${customer.id}`,
          customer,
          config.headers()
        );
      }

      if (res.data) {
        Swal.fire({
          title: "บันทึกข้อมูลสำเร็จ",
          text: "ข้อมูลถูกบันทึกเรียบร้อย",
          icon: "success",
          timer: 1000,
        });
        document.getElementById("modalCustomer_btnClose").click();
        fetchCustomers();
        setCustomer({ ...customer, id: undefined }); // Clear id
      }
    } catch (e) {
      console.error("Error:", e);

      // ตรวจสอบว่า error มาจากอีเมลซ้ำหรือไม่
      if (e.response?.data?.error === "อีเมลนี้ถูกใช้ไปแล้ว") {
        Swal.fire({
          icon: "warning",
          title: "อีเมลนี้ถูกใช้ไปแล้ว",
          text: "กรุณาใช้อีเมลอื่น",
        });
      } else {
        Swal.fire({
          title: "เกิดข้อผิดพลาด",
          text: e.response?.data?.error || "มีบางอย่างผิดพลาด!",
          icon: "error",
        });
      }
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(
        config.apiPath + "/api/customers",
        config.headers()
      );

      if (res.data) {
        // แสดงเฉพาะลูกค้าที่สถานะเป็น active
        const activeCustomers = res.data.filter(
          (customer) => customer.status === "active"
        );
        const sortedCustomers = activeCustomers.sort((a, b) => b.id - a.id);
        setCustomers(sortedCustomers);
      }
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message,
        icon: "error",
      });
    }
  };

  const clearForm = () => {
    setCustomer({
      name: "",
      email: "",
      pass: "",
      phone: "",
      address: "",
      bankName: "",
      bankAccountName: "",
      bankAccountNo: "",
    });
  };

  const handleRemove = async (item) => {
    try {
      const button = await Swal.fire({
        text: "remove item",
        title: "remove",
        icon: "question",
        showCancelButton: true,
        showConfirmButton: true,
      });

      if (button.isConfirmed) {
        const res = await axios.delete(
          config.apiPath + `/api/customers/${item.id}`,
          config.headers()
        );

        if (res.status === 200) {
          Swal.fire({
            title: "remove",
            text: "remove success",
            icon: "success",
            timer: 1000,
          });

          // รีเฟรชรายการลูกค้า
          fetchCustomers();
        }
      }
    } catch (e) {
      Swal.fire({
        title: "error",
        text: e.message,
        icon: "error",
      });
    }
  };

  const displayStatusText = (item) => {
    const baseClass =
      "badge text-white px-3 py-2 shadow-sm d-flex align-items-center justify-content-center";

    switch (item.status) {
      case "active":
        return <div className={`${baseClass} bg-success`}>ใช้งาน</div>;
      case "inactive":
        return <div className={`${baseClass} bg-info`}>โปรโมชั่น</div>;
      default:
        return <div className={`${baseClass} bg-secondary`}>ไม่มีสถานะ</div>;
    }
  };

  return (
    <BackOffice>
      <div className="card">
        <div className="card-header">
          <h4 className="mb-3" style={{ fontSize: "20px", fontWeight: "bold" }}>
            ลูกค้า
          </h4>
          <div className="d-flex flex-wrap">
            <button
              onClick={clearForm}
              className="btn btn-primary mr-2 mb-2"
              data-toggle="modal"
              data-target="#modalCustomer"
            >
              <i className="fa fa-plus mr-2"></i>เพิ่มบัญชีลูกค้า
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-bordered table-striped">
              <thead>
                <tr>
                  <th width="50px" className="text-center">
                    ไอดี
                  </th>
                  <th>ข้อมูลลูกค้า</th>
                  <th>อีเมล</th>
                  <th>รหัสผ่าน</th>
                  <th width="100px" className="text-center">
                    สถานะ
                  </th>
                  <th width="115px" className="text-center">
                    แก้ไข / ลบ
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.length > 0 ? (
                  customers.map((item) => (
                    <tr key={item.id}>
                      <td className="text-center">{item.id}</td>
                      <td>
                        ชื่อ : {item.name}
                        <br />
                        เบอร์ : {item.phone}
                        <br />
                        ที่อยู่ : {item.address}
                        <br />
                        ชื่อธนาคาร : {item.bankName}
                        <br />
                        ชื่อบัญชีธนาคาร : {item.bankAccountName}
                        <br />
                        เลขบัญชีธนาคาร : {item.bankAccountNo}
                      </td>
                      <td>{item.email}</td>
                      <td>{item.pass}</td>
                      <td>{displayStatusText(item)}</td>
                      <td className="text-center">
                        <button
                          className="btn btn-primary mr-2"
                          data-toggle="modal"
                          data-target="#modalCustomer"
                          onClick={(e) => setCustomer(item)}
                        >
                          <i className="fa fa-edit"></i>
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={(e) => handleRemove(item)}
                        >
                          <i className="fa fa-times"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center">
                      No customers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <MyModal id="modalCustomer" title="ข้อมูลลูกค้า">
        <div>
          <div>ชื่อ</div>
          <input
            value={customer.name || ""}
            className="form-control"
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
          />
        </div>
        <div className="mt-3">
          <div>อีเมล</div>
          <input
            value={customer.email || ""}
            className="form-control"
            onChange={(e) =>
              setCustomer({ ...customer, email: e.target.value })
            }
          />
        </div>
        <div className="mt-3">
          <div>รหัสผ่าน</div>
          <input
            type="password"
            value={customer.pass || ""}
            className="form-control"
            onChange={(e) => setCustomer({ ...customer, pass: e.target.value })}
          />
        </div>
        <div className="mt-3">
          <div>เบอร์เบอร์โทรศัพท์</div>
          <input
            value={customer.phone || ""}
            className="form-control"
            onChange={(e) =>
              setCustomer({ ...customer, phone: e.target.value })
            }
          />
        </div>
        <div className="mt-3">
          <div>ที่อยู่</div>
          <input
            value={customer.address || ""}
            className="form-control"
            onChange={(e) =>
              setCustomer({ ...customer, address: e.target.value })
            }
          />
        </div>
        <div className="mt-3">
          <div>ชื่อธนาคาร</div>
          <input
            value={customer.bankName || ""}
            className="form-control"
            onChange={(e) =>
              setCustomer({ ...customer, bankName: e.target.value })
            }
          />
        </div>
        <div className="mt-3">
          <div>ชื่อบัญชีธนาคาร</div>
          <input
            value={customer.bankAccountName || ""}
            className="form-control"
            onChange={(e) =>
              setCustomer({ ...customer, bankAccountName: e.target.value })
            }
          />
        </div>
        <div className="mt-3">
          <div>เลขบัญชีธนาคาร</div>
          <input
            value={customer.bankAccountNo || ""}
            className="form-control"
            onChange={(e) =>
              setCustomer({ ...customer, bankAccountNo: e.target.value })
            }
          />
        </div>
        <div className="mt-3">
          <button className="btn btn-primary" onClick={handleSave}>
            <i className="fa fa-check mr-2"></i>บันทึก
          </button>
        </div>
      </MyModal>
    </BackOffice>
  );
}

export default Customer;
