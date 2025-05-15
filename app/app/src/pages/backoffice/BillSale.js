import { useEffect, useState } from "react";
import BackOffice from "../../components/BackOffice";
import Swal from "sweetalert2";
import axios from "axios";
import config from "../../config";
import dayjs from "dayjs";
import MyModal from "../../components/MyModal";

function BillSale() {
  const [billSales, setBillSales] = useState([]);
  const [billSalesDetails, setBillSalesDetails] = useState([]);
  const [sumPrice, setSumPrice] = useState(0);
  const [sumQty, setSumQty] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [totalDeposit, setTotalDeposit] = useState(0);
  const [transferDate, setTransferDate] = useState("");
  const [transferTime, setTransferTime] = useState("");
  const [transferAccountName, setTransferAccountName] = useState("");
  const [transferBankName, setTransferBankName] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedBillForShipping, setSelectedBillForShipping] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSaleStatus, setSelectedSaleStatus] = useState("");
  const [selectedReturnStatus, setSelectedReturnStatus] = useState("");
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState("");

  useEffect(() => {
    fetchData();
    const urlParams = new URLSearchParams(window.location.search);
    const filterParam = urlParams.get("filter");
  
    if (filterParam) {
      if (filterParam === "approved") {
        setSelectedReturnStatus("approved"); // ตั้งค่าให้แสดงเฉพาะออเดอร์คืนสินค้าที่ได้รับการอนุมัติ
      } else {
        setSelectedSaleStatus(filterParam);
      }
    }
  }, []);
  

  const fetchData = async () => {
    try {
      const res = await axios.get(
        `${config.apiPath}/api/sale/list`,
        config.headers()
      );
      if (res.data.results) setBillSales(res.data.results);
    } catch (e) {
      Swal.fire({ title: "Error", text: e.message, icon: "error" });
    }
  };

  const openModalInfo = async (item) => {
    try {
      const res = await axios.get(
        `${config.apiPath}/api/sale/billInfo/${item.id}`,
        config.headers()
      );

      if (res.data.results) {
        setBillSalesDetails(res.data.results);
        let mySumPrice = 0;
        let sumQty = 0;

        for (let i = 0; i < res.data.results.length; i++) {
          mySumPrice += parseInt(res.data.results[i].price);
          sumQty++;
        }

        setSumPrice(mySumPrice);
        setSumQty(sumQty);

        // Set grandTotal and totalDeposit from BillSale
        const billSale = res.data.results[0]?.BillSale;
        if (billSale) {
          setGrandTotal(billSale.grandTotal || 0);
          setTotalDeposit(billSale.totalDeposit || 0);
          setTransferDate(
            billSale.transferDate
              ? dayjs(billSale.transferDate).format("DD/MM/YYYY")
              : ""
          );
          setReturnDate(
            billSale.returnDate
              ? dayjs(billSale.returnDate).format("DD/MM/YYYY")
              : ""
          );
          setTransferTime(billSale.transferTime || "");
          setTransferAccountName(billSale.transferAccountName || "");
          setTransferBankName(billSale.transferBankName || "");
          setSelectedBillForShipping(item);
          setShippingFee(billSale.shippingFee || 0);
        }
      }
    } catch (e) {
      Swal.fire({ title: "Error", text: e.message, icon: "error" });
    }
  };

  const handleStatusUpdate = async (item, status, title, text) => {
    try {
      const button = await Swal.fire({
        title,
        text,
        icon: "question",
        showCancelButton: true,
        showConfirmButton: true,
      });

      if (button.isConfirmed) {
        const res = await axios.patch(
          `${config.apiPath}/api/sale/updateStatus/${item.id}`,
          { status },
          config.headers()
        );

        if (res.data.message === "success") {
          Swal.fire({
            title: "Save",
            text: "บันทึกข้อมูลแล้ว",
            icon: "success",
            timer: 1000,
          });
          fetchData();
        }
      }
    } catch (e) {
      Swal.fire({ title: "Error", text: e.message, icon: "error" });
    }
  };

  const handleReturnStatusUpdate = async (item, returnStatus, title, text) => {
    try {
      const button = await Swal.fire({
        title,
        text,
        icon: "question",
        showCancelButton: true,
        showConfirmButton: true,
      });

      if (button.isConfirmed) {
        const res = await axios.patch(
          `${config.apiPath}/api/sale/updateReturnStatus/${item.id}`,
          { returnStatus },
          config.headers()
        );

        if (res.data.message === "success") {
          Swal.fire({
            title: "Save",
            text: "บันทึกข้อมูลแล้ว",
            icon: "success",
            timer: 1000,
          });
          fetchData();
        }
      }
    } catch (e) {
      Swal.fire({ title: "Error", text: e.message, icon: "error" });
    }
  };

  const handleShippingImageUpload = async () => {
    if (!selectedFile) {
      Swal.fire({ title: "Error", text: "กรุณาเลือกไฟล์", icon: "error" });
      return;
    }

    const formData = new FormData();
    formData.append("shippingImg", selectedFile);

    try {
      const confirm = await Swal.fire({
        title: "ยืนยันการจัดส่ง",
        text: "คุณต้องการอัพโหลดรูปภาพและยืนยันการจัดส่งสินค้าหรือไม่?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "ยืนยัน",
        cancelButtonText: "ยกเลิก",
      });

      if (!confirm.isConfirmed) return;

      const res = await axios.post(
        `${config.apiPath}/api/sale/uploadShippingImg/${selectedBillForShipping.id}`,
        formData,
        {
          headers: {
            ...config.headers(),
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res.data.message === "Shipping image uploaded successfully") {
        await axios.patch(
          `${config.apiPath}/api/sale/updateStatus/${selectedBillForShipping.id}`,
          { status: "send" },
          config.headers()
        );

        Swal.fire({
          title: "สำเร็จ",
          text: "อัพโหลดรูปภาพและเปลี่ยนสถานะบิลเรียบร้อยแล้ว",
          icon: "success",
          timer: 500,
        });
        document.getElementById("modalShipping_btnClose").click(); // ปิด modal
        // รีเฟรชข้อมูล
        fetchData();

        // รีเซ็ตข้อมูลไฟล์และอินพุต
        setSelectedFile(null);
        document.querySelector("input[type='file']").value = ""; // รีเซ็ตค่าอินพุต
      }
    } catch (e) {
      Swal.fire({ title: "Error", text: e.message, icon: "error" });
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const displayStatusText = (item) => {
    const baseClass =
      "badge text-white px-3 py-2 shadow-sm d-flex align-items-center justify-content-center";

    switch (item.status) {
      case "wait":
        return <div className={`${baseClass} bg-secondary`}>รอดำเนินการ</div>;
      case "pay":
        return <div className={`${baseClass} bg-info`}>ได้รับชำระแล้ว</div>;
      case "send":
        return <div className={`${baseClass} bg-success`}>จัดส่งสำเร็จ</div>;
      case "cancel":
        return <div className={`${baseClass} bg-danger`}>ยกเลิกรายการ</div>;
      default:
        return null;
    }
  };

  const displayReturnStatus = (status) => {
    const baseClass =
      "badge text-white px-3 py-2 shadow-sm d-flex align-items-center justify-content-center";

      switch (status) {
        case "pending":
          return <div className={`${baseClass} bg-secondary`}>รอดำเนินการ</div>;
        case "Waitingtocheck":
          return <div className={`${baseClass} bg-info`}>รอตรวจสอบ</div>;
        case "approved":
          return <div className={`${baseClass} bg-success`}>คืนสินค้าสำเร็จ</div>;
        case "rejected":
          return <div className={`${baseClass} bg-danger`}>สินค้าชำรุด</div>;
        case "overdue":
          return <div className={`${baseClass} bg-warning`}>เลยกำหนด</div>;
        default:
          return <div className={`${baseClass} bg-secondary`}>ไม่ระบุ</div>;
      }      
  };

  const displaydeliveryMethod = (deliveryMethod) => {
    const baseClass =
      "badge text-white px-3 py-2 shadow-sm d-flex align-items-center justify-content-center";

    switch (deliveryMethod) {
      case "pickup":
        return <div className={`${baseClass} bg-success`}>รับเอง</div>;
      case "delivery":
        return <div className={`${baseClass} bg-info`}>จัดส่ง</div>;
      default:
        return <div className={`${baseClass} bg-secondary`}>ไม่ระบุ</div>;
    }
  };

  function showImage(imgPath) {
    return imgPath ? (
      <img
        alt=""
        className="img-fluid"
        src={`${config.apiPath}/uploads/${imgPath}`}
        style={{ width: "125px", height: "125px" }}
      />
    ) : (
      <></>
    );
  }

  const filteredBillSales = billSales.filter((item) => {
    const searchString =
      `${item.id} ${item.Customer.name} ${item.Customer.phone} ${item.Customer.address}`.toLowerCase();

    const matchesSearchTerm = searchString.includes(searchTerm.toLowerCase());
    const matchesSaleStatus =
      selectedSaleStatus === "" || item.status === selectedSaleStatus;
    const matchesReturnStatus =
      selectedReturnStatus === "" || item.returnStatus === selectedReturnStatus;
    const matchesDeliveryMethod =
      selectedDeliveryMethod === "" ||
      item.deliveryMethod === selectedDeliveryMethod;

    return (
      matchesSearchTerm &&
      matchesSaleStatus &&
      matchesReturnStatus &&
      matchesDeliveryMethod
    );
  });

  return (
    <BackOffice>
      <div className="card">
        <div className="card-header">
          <h4
            className="mb-3 mt-3"
            style={{ fontSize: "20px", fontWeight: "bold" }}
          >
            รายงานการเช่า
          </h4>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="ค้นหา ( ไอดี ชื่อลูกค้า เบอร์โทร หรือที่อยู่ )"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="col-md-3">
              <select
                className="form-control"
                value={selectedDeliveryMethod}
                onChange={(e) => setSelectedDeliveryMethod(e.target.value)}
              >
                <option value="">-- วิธีการจัดส่ง --</option>
                <option value="pickup">รับเอง</option>
                <option value="delivery">จัดส่ง</option>
              </select>
            </div>

            <div className="col-md-3">
              <select
                className="form-control"
                value={selectedSaleStatus}
                onChange={(e) => setSelectedSaleStatus(e.target.value)}
              >
                <option value="">-- สถานะเช่า --</option>
                <option value="wait">รอตรวจสอบ</option>
                <option value="pay">ชำระแล้ว</option>
                <option value="send">จัดส่งแล้ว</option>
                <option value="cancel">ยกเลิกรายการ</option>
              </select>
            </div>

            <div className="col-md-3">
              <select
                className="form-control"
                value={selectedReturnStatus}
                onChange={(e) => setSelectedReturnStatus(e.target.value)}
              >
                <option value="">-- สถานะคืน --</option>
                <option value="pending">รอดำเนินการ</option>
                <option value="Waitingtocheck">รอตรวจสอบ</option>
                <option value="approved">คืนสินค้าแล้ว</option>
                <option value="rejected">ถูกปฏิเสธ</option>
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered table-striped">
              <thead>
                <tr>
                  <th width="10px">ไอดี</th>
                  <th>ข้อมูลลูกค้า</th>
                  <th width="110px" className="text-center">
                    วันที่สั่งเช่า
                  </th>
                  <th width="100px" className="text-center">
                    การจัดส่ง
                  </th>
                  <th width="100px" className="text-center">
                    สถานะเช่า
                  </th>
                  <th width="175px" className="text-center">
                    การดำเนินการเช่า
                  </th>
                  <th width="100px" className="text-center">
                    สถานะคืน
                  </th>
                  <th width="175px" className="text-center">
                    การดำเนินการคืน
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredBillSales.length > 0 ? (
                  filteredBillSales.map((item) => (
                    <tr key={item.id}>
                      <td className="text-center">{item.id}</td>
                      <td>
                        ชื่อ : {item.Customer.name}
                        <br />
                        เบอร์ : {item.Customer.phone}
                        <br />
                        ที่อยู่ : {item.Customer.address}
                        <br />
                        ชื่อธนาคาร : {item.Customer.bankName}
                        <br />
                        ชื่อบัญชีธนาคาร : {item.Customer.bankAccountName}
                        <br />
                        เลขบัญชีธนาคาร : {item.Customer.bankAccountNo}
                      </td>
                      <td className="text-center">
                        {dayjs(item.Date).format("DD/MM/YYYY")}
                        <br />
                        {item.Time}
                      </td>
                      <td>{displaydeliveryMethod(item.deliveryMethod)}</td>
                      <td>{displayStatusText(item)}</td>
                      <td className="text-center">
                        <div className="btn-group-vertical">
                          <button
                            className="btn btn-secondary mb-2"
                            data-toggle="modal"
                            data-target="#modalInfo"
                            onClick={() => openModalInfo(item)}
                          >
                            <i className="fa fa-file-alt mr-2"></i> รายการเช่า
                          </button>
                          <button
                            className="btn btn-success mb-2"
                            onClick={() => setSelectedBillForShipping(item)}
                            data-toggle="modal"
                            data-target="#modalShipping"
                          >
                            <i className="fa fa-shipping-fast mr-2"></i>{" "}
                            จัดส่งสำเร็จ
                          </button>
                          <button
                            className="btn btn-danger mb-2"
                            onClick={() =>
                              handleStatusUpdate(
                                item,
                                "cancel",
                                "ยืนยันการยกเลิก",
                                "คุณต้องการยกเลิกรายการนี้?"
                              )
                            }
                          >
                            <i className="fa fa-times mr-2"></i> ยกเลิกรายการ
                          </button>
                        </div>
                      </td>

                      <td>{displayReturnStatus(item.returnStatus)}</td>
                      <td className="text-center">
                        <div className="btn-group-vertical">
                          <button
                            className="btn btn-secondary mb-2"
                            data-toggle="modal"
                            data-target="#modalInfoReturn"
                            onClick={() => openModalInfo(item)}
                          >
                            <i className="fa fa-file-alt mr-2"></i> รายการคืน
                          </button>
                          <button
                            className="btn btn-success mb-2"
                            onClick={() =>
                              handleReturnStatusUpdate(
                                item,
                                "approved",
                                "ยืนยันการอนุมัติการคืนสินค้า",
                                "คุณต้องการอนุมัติการคืนสินค้ารายการนี้?"
                              )
                            }
                          >
                            <i className="fa fa-check mr-2"></i> คืนสินสำเร็จ
                          </button>
                          <button
                            className="btn btn-warning mb-2"
                            onClick={() =>
                              handleReturnStatusUpdate(
                                item,
                                "overdue",
                                "ยืนยันการปฏิเสธการคืนสินค้า",
                                "คุณต้องการปฏิเสธการคืนสินค้ารายการนี้?"
                              )
                            }
                          >
                            <i className="fa fa-clock  mr-2"></i> เลยกำหนด
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() =>
                              handleReturnStatusUpdate(
                                item,
                                "rejected",
                                "ยืนยันการปฏิเสธการคืนสินค้า",
                                "คุณต้องการปฏิเสธการคืนสินค้ารายการนี้?"
                              )
                            }
                          >
                            <i className="fa fa-times mr-2"></i> สินค้าชำรุด
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="text-center">
                      No sales data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <MyModal id="modalInfo" title="รายการของบิลการเช่า">
        <table className="table table-bordered table-striped">
          <thead>
            <tr>
              <th width="150">ภาพสินค้า</th>
              <th>รายการ</th>
              <th className="text-right">ราคา</th>
            </tr>
          </thead>
          <tbody>
            {billSalesDetails.map((item) => (
              <tr key={item.id}>
                <td>
                  {showImage(
                    item.Product.images.length > 0
                      ? item.Product.images[0].url
                      : null
                  )}
                </td>
                <td>{item.Product.name}</td>
                <td className="text-right">
                  {parseInt(item.price).toLocaleString("th-TH")}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="3" className="text-center fw-bold">
                สินค้าจำนวน ({sumQty}) รายการ ยอดโอน (
                {grandTotal.toLocaleString("th-TH")}) บาท
              </td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-4 p-3 border rounded bg-light">
          <h5 className="mb-3">สรุปรายละเอียดการโอน</h5>
          <div className="row">
            <div className="col-md-4">
              <p>
                <strong>สั่งเช่า :</strong> {sumPrice.toLocaleString("th-TH")}{" "}
                บาท
              </p>
              <p>
                <strong>ค่ามัดจำ :</strong>{" "}
                {totalDeposit.toLocaleString("th-TH")} บาท
              </p>
              <p>
                <strong>ค่าจัดส่ง :</strong>{" "}
                {shippingFee.toLocaleString("th-TH")} บาท
              </p>
              <p>
                <strong>ยอดรวม :</strong> {grandTotal.toLocaleString("th-TH")}{" "}
                บาท
              </p>
            </div>
            <div className="col-md-8">
              <p>
                <strong>วันที่โอน :</strong> {transferDate}
              </p>
              <p>
                <strong>เวลาโอน :</strong> {transferTime}
              </p>
              <p>
                <strong>ชื่อบัญชีลูกค้า :</strong> {transferAccountName}
              </p>
              <p>
                <strong>ชื่อธนาคารลูกค้า :</strong> {transferBankName}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 d-flex flex-column align-items-center text-center">
          <h5 className="mb-3">รูปภาพสลิป</h5>
          {selectedBillForShipping?.Paymentimg ? (
            <img
              src={`${config.apiPath}/${selectedBillForShipping.Paymentimg}`}
              alt="Paymentimg"
              className="img-fluid border rounded"
              style={{ maxWidth: "300px", maxHeight: "400px" }}
            />
          ) : (
            <p className="text-muted">ไม่มีรูปภาพสลิป</p>
          )}
        </div>

        <div className="mt-4 d-flex flex-column align-items-center text-center">
          <h5 className="mb-3">รูปภาพการจัดส่ง</h5>
          {selectedBillForShipping?.shippingimg ? (
            <img
              src={`${config.apiPath}/${selectedBillForShipping.shippingimg}`}
              alt="Shipping"
              className="img-fluid border rounded"
              style={{ maxWidth: "300px", maxHeight: "400px" }}
            />
          ) : (
            <p className="text-muted">ไม่มีรูปภาพการจัดส่ง</p>
          )}
        </div>
      </MyModal>

      <MyModal id="modalInfoReturn" title="รายการของบิลการคืน">
        <div className="mt-4 p-3 border rounded bg-light">
          <h5 className="mb-3">สรุปรายละเอียดการคืน</h5>
          <div className="row">
            <div className="col-md-6">
              <p>
                <strong>ค่ามัดจำ:</strong>{" "}
                {totalDeposit.toLocaleString("th-TH")} บาท
              </p>
            </div>
            <div className="col-md-6">
              <p>
                <strong>วันที่ต้องคืน:</strong> {returnDate}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 d-flex flex-column align-items-center text-center">
          <h5 className="mb-3">รูปภาพสินค้าที่คืน</h5>
          {selectedBillForShipping?.Returnimg ? (
            <img
              src={`${config.apiPath}/${selectedBillForShipping.Returnimg}`}
              alt="Return"
              className="img-fluid border rounded"
              style={{ maxWidth: "300px", maxHeight: "400px" }}
            />
          ) : (
            <p className="text-muted">ไม่มีรูปภาพสินค้าที่คืน</p>
          )}
        </div>
      </MyModal>

      <MyModal id="modalShipping" title="อัพโหลดรูปการจัดส่ง">
        <div>
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            className="form-control mb-3"
          />
          {selectedFile && (
            <div className="mb-3" style={{ textAlign: "center" }}>
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Preview"
                className="img-fluid border rounded mt-2"
                style={{
                  maxWidth: "300px",
                  maxHeight: "400px",
                  margin: "0 auto",
                  display: "block",
                }}
              />
            </div>
          )}
          <button
            className="btn btn-primary"
            onClick={handleShippingImageUpload}
          >
            <i className="fa fa-upload mr-2"></i> อัพโหลด
          </button>
        </div>
      </MyModal>
    </BackOffice>
  );
}

export default BillSale;
