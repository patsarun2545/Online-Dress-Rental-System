import { useEffect, useState } from "react";
import BackOffice from "../../components/BackOffice";
import MyModal from "../../components/MyModal";
import Swal from "sweetalert2";
import axios from "axios";
import config from "../../config";
import { useNavigate } from "react-router-dom";

function Account() {
  const [account, setAccount] = useState({}); // CREATE, UPDATE
  const [accounts, setAccounts] = useState([]); // SHOW
  const [currentUser, setCurrentUser] = useState(null); 
  const navigate = useNavigate();

  useEffect(() => {
    checkPermissionAndFetchData();
  }, []);

  const checkPermissionAndFetchData = async () => {
    try {
      const userRes = await axios.get(
        config.apiPath + "/user/info",
        config.headers()
      );

      if (userRes.data.result) {
        setCurrentUser(userRes.data.result);

        if (userRes.data.result.status !== "owner") {
          Swal.fire({
            title: "ไม่มีสิทธิ์เข้าถึง",
            text: "เฉพาะเจ้าของร้านเท่านั้นที่สามารถจัดการข้อมูลบัญชีร้านได้",
            icon: "error",
            timer: 5000,
          });
          navigate("/dashboard");
          return;
        }

        fetchAccounts();
      }
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: "เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์",
        icon: "error",
      });
      navigate("/dashboard");
    }
  };

  const handleSave = async () => {
    try {
      if (currentUser?.status !== "owner") {
        Swal.fire({
          title: "ไม่มีสิทธิ์ดำเนินการ",
          text: "เฉพาะเจ้าของร้านเท่านั้นที่สามารถจัดการข้อมูลบัญชีร้านได้",
          icon: "error",
        });
        return;
      }

      let res;

      if (account.id === undefined) {
        res = await axios.post(
          config.apiPath + "/api/account/create",
          account,
          config.headers()
        );
      } else {
        res = await axios.put(
          config.apiPath + "/api/account/update",
          account,
          config.headers()
        );
      }

      if (res.data.message === "success") {
        Swal.fire({
          title: "บันทึกสำเร็จ",
          text: "บันทึกข้อมูลเรียบร้อยแล้ว",
          icon: "success",
          timer: 1000,
        });
        document.getElementById("modalAccount_btnClose").click();
        fetchAccounts();

        setAccount({ ...account, id: undefined });
      }
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message,
        icon: "error",
      });
    }
  };

  const handleRemove = async (item) => {
    try {
      if (currentUser?.status !== "owner") {
        Swal.fire({
          title: "ไม่มีสิทธิ์ดำเนินการ",
          text: "เฉพาะเจ้าของร้านเท่านั้นที่สามารถลบข้อมูลบัญชีร้านได้",
          icon: "error",
        });
        return;
      }

      const button = await Swal.fire({
        text: "คุณต้องการลบบัญชีร้านนี้ใช่หรือไม่?",
        title: "ยืนยันการลบ",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "ยืนยัน",
        cancelButtonText: "ยกเลิก",
      });

      if (button.isConfirmed) {
        const res = await axios.delete(
          config.apiPath + "/api/account/remove/" + item.id,
          config.headers()
        );

        if (res.data.message === "success") {
          Swal.fire({
            title: "ลบสำเร็จ",
            text: "ลบข้อมูลบัญชีร้านเรียบร้อยแล้ว",
            icon: "success",
            timer: 1000,
          });

          fetchAccounts();
        }
      }
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message,
        icon: "error",
      });
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await axios.get(
        config.apiPath + "/api/account/list",
        config.headers()
      );

      if (res.data.results !== undefined) {
        setAccounts(res.data.results);
      }
    } catch (e) {
      Swal.fire({
        title: "error",
        text: e.message,
        icon: "error",
      });
    }
  };

  const clearForm = () => {
    setAccount({
      accountName: "",
      accountNumber: "",
      bankName: "",
    });
  };


  const displayStatusText = (item) => {
    const baseClass =
      "badge text-white px-3 py-2 shadow-sm d-flex align-items-center justify-content-center";

    switch (item.status) {
      case "use":
        return <div className={`${baseClass} bg-success`}>ใช้งาน</div>;
      case "delete":
        return <div className={`${baseClass} bg-danger`}>ลบบัญชี</div>;
      default:
        return <div className={`${baseClass} bg-secondary`}>ไม่มีสถานะ</div>;
    }
  };

  return (
    <BackOffice>
      <div className="card">
        <div className="card-header">
          <h4 className="mb-3" style={{ fontSize: "20px", fontWeight: "bold" }}>
            บัญชีร้าน
          </h4>
          <div className="d-flex flex-wrap">
            <button
              onClick={clearForm}
              className="btn btn-primary mr-2 mb-2"
              data-toggle="modal"
              data-target="#modalAccount"
            >
              <i className="fa fa-plus mr-2"></i>เพิ่มบัญชีร้าน
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-bordered table-striped">
              <thead>
                <tr>
                  <th>ชื่อธนาคาร</th>
                  <th>ชื่อบัญชี</th>
                  <th>เลขที่บัญชี</th>
                  <th width="100px" className="text-center">
                    สถานะ
                  </th>
                  <th width="115px" className="text-center">
                    แก้ไข / ลบ
                  </th>
                </tr>
              </thead>
              <tbody>
                {accounts.length > 0 ? (
                  accounts.map((item) => {
                    return (
                      <tr key={item.id}>
                        <td>{item.bankName}</td>
                        <td>{item.accountName}</td>
                        <td>{item.accountNumber}</td>
                        <td>{displayStatusText(item)}</td>
                        <td className="text-center">
                          <button
                            className="btn btn-primary mr-2"
                            data-toggle="modal"
                            data-target="#modalAccount"
                            onClick={(e) => setAccount(item)}
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
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center">
                      No accounts found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <MyModal id="modalAccount" title="ข้อมูลบัญชีร้าน">
        <div>
          <div>ชื่อธนาคาร</div>
          <input
            value={account.bankName || ""}
            className="form-control"
            onChange={(e) =>
              setAccount({ ...account, bankName: e.target.value })
            }
          />
        </div>
        <div className="mt-3">
          <div>ชื่อบัญชี</div>
          <input
            value={account.accountName || ""}
            className="form-control"
            onChange={(e) =>
              setAccount({ ...account, accountName: e.target.value })
            }
          />
        </div>
        <div className="mt-3">
          <div>เลขที่บัญชี</div>
          <input
            value={account.accountNumber || ""}
            className="form-control"
            onChange={(e) =>
              setAccount({ ...account, accountNumber: e.target.value })
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

export default Account;
