import { useEffect, useState } from "react";
import BackOffice from "../../components/BackOffice";
import MyModal from "../../components/MyModal";
import Swal from "sweetalert2";
import axios from "axios";
import config from "../../config";

function RentalDays() {
  const [rentalDay, setRentalDay] = useState({}); // CREATE, UPDATE
  const [rentalDays, setRentalDays] = useState([]); // SHOW

  useEffect(() => {
    fetchRentalDays();
  }, []);

  const handleSave = async () => {
    try {
      let res;

      if (rentalDay.id === undefined) {
        res = await axios.post(
          config.apiPath + "/api/rental-days/save",
          rentalDay,
          config.headers()
        );
      } else {
        res = await axios.post(
          config.apiPath + "/api/rental-days/save",
          rentalDay,
          config.headers()
        );
      }

      if (res.data.message === "Rental day saved successfully") {
        Swal.fire({
          title: "Save",
          text: "Success",
          icon: "success",
          timer: 500,
        });
        document.getElementById("modalRentalDays_btnClose").click();
        fetchRentalDays();

        setRentalDay({ ...rentalDay, id: undefined });
      }
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message,
        icon: "error",
      });
    }
  };

  const fetchRentalDays = async () => {
    try {
      const res = await axios.get(
        config.apiPath + "/api/rental-days",
        config.headers()
      );

      if (res.data.results !== undefined) {
        setRentalDays(res.data.results);
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
    setRentalDay({
      days: "",
      discount: "",
      description: "",
      shippingFee: "",
      status: "active",
    });
  };

  const handleRemove = async (item) => {
    try {
      const button = await Swal.fire({
        text: "Remove item?",
        title: "Remove",
        icon: "question",
        showCancelButton: true,
        showConfirmButton: true,
      });

      if (button.isConfirmed) {
        await axios.post(
          config.apiPath + "/api/rental-days/save",
          { ...item, status: "inactive" },
          config.headers()
        );

        Swal.fire({
          title: "Remove",
          text: "Remove success",
          icon: "success",
          timer: 1000,
        });

        fetchRentalDays();
      }
    } catch (e) {
      Swal.fire({
        title: "Error",
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
          <h4 className="mb-3" style={{ fontSize: "20px", fontWeight: "bold" }}>โปรโมชั่น</h4>
          <div className="d-flex flex-wrap">
            <button
              onClick={clearForm}
              className="btn btn-primary mr-2 mb-2"
              data-toggle="modal"
              data-target="#modalRentalDays"
            >
              <i className="fa fa-plus mr-2"></i>เพิ่มวันเช่า
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-bordered table-striped">
              <thead>
                <tr>
                  <th width="100px">วันที่เช่า</th>
                  <th width="100px">ส่วนลด</th>
                  <th width="100px">ค่าจัดส่ง</th>
                  <th>คำอธิบาย</th>
                  <th width="100px" className="text-center">สถานะ</th>
                  <th width="115px" className="text-center">
                    แก้ไข / ลบ
                  </th>
                </tr>
              </thead>
              <tbody>
                {rentalDays.length > 0 ? (
                  rentalDays.map((item) => (
                    <tr key={item.id}>
                      <td>{item.days} วัน</td>
                      <td>{item.discount * 100}%</td>
                      <td>{item.shippingFee}</td>
                      <td>{item.description}</td>
                      <td>{displayStatusText(item)}</td>
                      <td className="text-center">
                        <button
                          className="btn btn-primary mr-2"
                          data-toggle="modal"
                          data-target="#modalRentalDays"
                          onClick={() => setRentalDay(item)}
                        >
                          <i className="fa fa-edit"></i>
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleRemove(item)}
                        >
                          <i className="fa fa-times"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center">
                      No rental days found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <MyModal id="modalRentalDays" title="ข้อมูลวันเช่า">
        <div>
          <div>วันที่เช่า เช่น 1 วัน</div>
          <input
            value={rentalDay.days || ""}
            className="form-control"
            type="number"
            step="0.01"
            onChange={(e) => setRentalDay({ ...rentalDay, days: parseFloat(e.target.value) })}
          />
        </div>
        <div className="mt-3">
          <div>ส่วนลดในรูปแบบเปอร์เซ็นต์ เช่น 0.1 = 10%</div>
          <input
            value={(rentalDay.discount || 0) * 100}
            className="form-control"
            type="number"
            step="0.01"
            onChange={(e) =>
              setRentalDay({ ...rentalDay, discount: parseFloat(e.target.value) / 100 })
            }
          />
        </div>
        <div className="mt-3">
          <div>ค่าจัดส่ง เช่น 50 บาท</div>
          <input
            value={rentalDay.shippingFee || ""}
            className="form-control"
            onChange={(e) =>
              setRentalDay({ ...rentalDay, shippingFee: parseFloat(e.target.value) })
            }
          />
        </div>
        <div className="mt-3">
          <div>คำอธิบาย เช่น โปรโมชั่นลดส่งท้ายปี </div>
          <input
            value={rentalDay.description || ""}
            className="form-control"
            onChange={(e) =>
              setRentalDay({ ...rentalDay, description: e.target.value })
            }
          />
        </div>
        <div className="mt-3">
          <button className="btn btn-primary" onClick={handleSave}>
            <i className="fa fa-check mr-2"></i>Save
          </button>
        </div>
      </MyModal>
    </BackOffice>
  );
}

export default RentalDays;
