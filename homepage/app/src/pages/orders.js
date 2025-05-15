import axios from "axios";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import BackOffice from "../components/BackOffice";
import config from "../config";
import "./orders.css";

function Orders() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState({
    id: null,
    name: "",
    phone: "",
    address: "",
  });
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState({}); // Store order items for each order
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingOrderId, setUploadingOrderId] = useState(null);
  const [selectedPaymentFile, setSelectedPaymentFile] = useState(null);
  const [uploadingPaymentId, setUploadingPaymentId] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [expandedShipping, setExpandedShipping] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire("กรุณาเข้าสู่ระบบก่อน", "กรุณาเข้าสู่ระบบก่อน", "warning");
      navigate("/singin");
      return;
    }

    fetchCustomerData(token);
  }, [navigate]);

  useEffect(() => {
    if (customer.id) {
      fetchOrders(customer.id);
    }
  }, [customer.id]);

  const fetchCustomerData = async (token) => {
    try {
      const res = await axios.get(config.apiPath + "/api/info", {
        headers: { Authorization: token },
      });
      setCustomer({
        id: res.data.id,
        name: res.data.name,
        phone: res.data.phone || "ไม่ระบุ",
        address: res.data.address || "ไม่ระบุ",
      });
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า:", error);
      Swal.fire("Error", "ดึงข้อมูลลูกค้าไม่สำเร็จ", "error");
    }
  };

  const fetchOrders = async (customerId) => {
    try {
      const res = await axios.get(`${config.apiPath}/api/sale/list`, {
        params: { customerId },
      });
      setOrders(res.data.results);

      // Fetch order items for each order
      const items = {};
      for (const order of res.data.results) {
        const orderItemsRes = await axios.get(
          `${config.apiPath}/api/sale/billInfo/${order.id}`
        );
        items[order.id] = orderItemsRes.data.results;
      }
      setOrderItems(items);
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ:", error);
      Swal.fire("Error", "ดึงข้อมูลคำสั่งซื้อไม่สำเร็จ", "error");
    }
  };

  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return "ไม่ระบุ";
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    return end.diff(start, "day"); // คำนวณวันระหว่างสองวันที่
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handlePaymentFileChange = (event) => {
    setSelectedPaymentFile(event.target.files[0]);
  };

  const handlePaymentUpload = async (billSaleId) => {
    if (!selectedPaymentFile) {
      Swal.fire("Error", "กรุณาเลือกไฟล์ก่อนอัพโหลด", "warning");
      return;
    }

    const formData = new FormData();
    formData.append("paymentImg", selectedPaymentFile);

    try {
      setUploadingPaymentId(billSaleId);
      const response = await axios.post(
        `${config.apiPath}/api/sale/uploadPaymentImg/${billSaleId}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      Swal.fire("Success", response.data.message, "success");

      // Update the order status to "pay" after successful upload
      await axios.patch(
        `${config.apiPath}/api/sale/updateStatus/${billSaleId}`,
        { status: "pay" },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      Swal.fire({
        title: "สำเร็จ!",
        text: "อัพโหลดหลักฐานการชำระเงินเรียบร้อยแล้ว!",
        icon: "success",
        timer: 1000,
        showConfirmButton: false,
      });

      setUploadingPaymentId(null);
      fetchOrders(customer.id); // Refresh orders to show updated status
    } catch (error) {
      console.error(
        "เกิดข้อผิดพลาดในการอัปโหลดภาพการชำระเงินหรืออัปเดตสถานะ:",
        error
      );
      Swal.fire(
        "Error",
        "ไม่สามารถอัปโหลดภาพการชำระเงินหรืออัปเดตสถานะได้",
        "error"
      );
      setUploadingPaymentId(null);
    }
  };

  const handleUpload = async (orderId) => {
    if (!selectedFile) {
      Swal.fire("Error", "กรุณาเลือกไฟล์ก่อนอัพโหลด", "warning");
      return;
    }

    const formData = new FormData();
    formData.append("returnImg", selectedFile);

    try {
      setUploadingOrderId(orderId);
      const uploadRes = await axios.post(
        `${config.apiPath}/api/sale/uploadReturnImg/${orderId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      Swal.fire("Success", uploadRes.data.message, "success");

      // Update return status to "approved"
      await axios.patch(
        `${config.apiPath}/api/sale/updateReturnStatus/${orderId}`,
        { returnStatus: "Waitingtocheck" },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      Swal.fire({
        title: "สำเร็จ!",
        text: "อัพโหลดรูปส่งคือสินค้าเรียบร้อยแล้ว!",
        icon: "success",
        timer: 1000,
        showConfirmButton: false,
      });

      setUploadingOrderId(null);
      fetchOrders(customer.id); // Refresh orders to show the updated status
    } catch (error) {
      console.error(
        "เกิดข้อผิดพลาดระหว่างการอัปโหลดไฟล์หรือการอัปเดตสถานะ:",
        error
      );
      Swal.fire("Error", "ไม่สามารถอัปโหลดหรืออัปเดตสถานะ", "error");
      setUploadingOrderId(null);
    }
  };

  const displayStatusText = (item) => {
    const baseClass =
      "badge text-white px-3 py-2 shadow-sm d-flex align-items-center justify-content-center";

    const handleShowShippingimg = () => {
      Swal.fire({
        title: "หลักฐานการจัดส่ง",
        imageUrl: `${config.apiPath}/${item.shippingimg}`,
        imageAlt: "Shipping Image",
        imageWidth: 450,
        imageHeight: 450,
        confirmButtonText: "ปิด",
      });
    };

    switch (item.status) {
      case "wait":
        return <div className={`${baseClass} bg-secondary`}>รอดำเนินการ</div>;
      case "pay":
        return <div className={`${baseClass} bg-info`}>ได้รับชำระแล้ว</div>;
      case "send":
        return (
          <div
            className={`${baseClass} bg-success`}
            style={{ cursor: "pointer" }}
            onClick={handleShowShippingimg}
          >
            จัดส่งสำเร็จ
          </div>
        );
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
        return <div className={`${baseClass} bg-danger`}>สินค้าชำรุดยึดมัดจำทั้งหมด</div>;
      case "overdue":
        return <div className={`${baseClass} bg-warning`}>เลยกำหนดยึดมัดจำตามระยะเวลา</div>;
      default:
        return <div className={`${baseClass} bg-secondary`}>ไม่ระบุ</div>;
    }
  };

  const toggleOrderItems = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId], // toggle สถานะเปิด/ปิด
    }));
  };

  const toggleShipping = (orderId) => {
    setExpandedShipping((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  return (
    <BackOffice>
      <div className="container mt-3">
        {orders.length > 0 ? (
          <>
            <h4 className="ms-3">รายการเช่าของคุณ</h4>
            {orders.map((order) => (
              <div key={order.id} className="card mb-3">
                {/* ส่วนหัวคำสั่งซื้อ */}
                <div className="card-header d-flex justify-content-between align-items-center">
                  <span>หมายเลขรายการเช่า {order.id}</span>
                  <div className="d-flex align-items-center">
                    <span className="me-2">สถานะคำสั่งเช่า :</span>
                    {displayStatusText(order)}
                  </div>
                </div>

                {/* รายการสินค้า */}
                {orderItems[order.id] && orderItems[order.id].length > 0 ? (
                  <>
                    <div className="mt-3 ps-3">
                      <h6 className="order-title">รายการสินค้า</h6>
                    </div>

                    <div className="overflow-x-auto ps-3 pe-3">
                      <table className="table table-bordered table-striped w-100">
                        <thead>
                          <tr>
                            <th style={{ width: "10%" }}>รูปสินค้า</th>
                            <th style={{ width: "20%" }}>ชื่อ</th>
                            <th style={{ width: "50%" }}>รายละเอียด</th>
                            <th style={{ width: "20%" }}>ราคา</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* แสดงสินค้าเฉพาะ 1 รายการแรก หรือทั้งหมดขึ้นอยู่กับ expandedOrders */}
                          {orderItems[order.id]
                            .slice(0, expandedOrders[order.id] ? undefined : 1) // แสดง 1 รายการแรกถ้าไม่ได้เปิด
                            .map((item) => (
                              <tr key={item.id}>
                                <td>
                                  <img
                                    src={
                                      item.Product.images.length > 0
                                        ? `${config.apiPath}/uploads/${item.Product.images[0].url}`
                                        : "default_image.jpg"
                                    }
                                    alt={item.Product.name}
                                    style={{ width: "100px", height: "100px" }}
                                  />
                                </td>
                                <td>{item.Product.name}</td>
                                <td>{item.Product.detail}</td>
                                <td>
                                  {item.price} บาท
                                  <br />
                                  <br />
                                  <small className="text-muted">
                                    เวลาเช่า{" "}
                                    {calculateDays(
                                      order.Date,
                                      order.returnDate
                                    )}{" "}
                                    วัน
                                  </small>
                                  <br />
                                  <small className="text-muted">
                                    ค่ามัดจำ {item.Product.deposit} บาท
                                  </small>
                                </td>
                              </tr>
                            ))}
                        </tbody>

                        {/* เพิ่มส่วนยอดรวมใต้ตาราง */}
                        <tfoot>
                          {expandedShipping[order.id] && (
                            <>
                              <tr>
                                <td colSpan="3" className="text-end fw-bold">
                                  ค่าสินค้า
                                </td>
                                <td className="fw-bold">
                                  {order.totalPrice} บาท
                                </td>
                              </tr>
                              <tr>
                                <td colSpan="3" className="text-end fw-bold">
                                  ค่าจัดส่ง
                                </td>
                                <td className="fw-bold">
                                  {order.shippingFee} บาท
                                </td>
                              </tr>
                              <tr>
                                <td colSpan="3" className="text-end fw-bold">
                                  ค่ามัดจำรวม
                                </td>
                                <td className="fw-bold">
                                  {order.totalDeposit} บาท
                                </td>
                              </tr>
                            </>
                          )}
                          <tr>
                            <td colSpan="3" className="text-end fw-bold">
                              จำนวน ({orderItems[order.id].length}) รายการ
                              ยอดรวม
                            </td>
                            <td className="fw-bold">{order.grandTotal} บาท</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* ปุ่มดูเพิ่มเติม และ ปุ่มค่าจัดส่ง */}
                    <div className="d-flex justify-content-between px-3 mt-2">
                      {orderItems[order.id].length > 1 && (
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => toggleOrderItems(order.id)}
                        >
                          {expandedOrders[order.id]
                            ? "ย่อรายการ"
                            : `ดูเพิ่มเติม (ซ่อน ${
                                orderItems[order.id].length - 1
                              } รายการ)`}
                        </button>
                      )}

                      <button
                        className="btn btn-outline-primary btn-sm ms-auto"
                        onClick={() => toggleShipping(order.id)}
                      >
                        {expandedShipping[order.id]
                          ? "ซ่อนรายละเอียด"
                          : "ดูรายละเอียด"}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="ps-3">ไม่มีสินค้าในรายการเช่านี้</p>
                )}

                {/* ข้อมูลอื่น ๆ */}
                <div className="card-body">
                  <div className="row row-cols-2 g-3">
                    <div className="col">
                      <p>
                        วันที่เช่า :{" "}
                        {order.Date
                          ? dayjs(order.Date).format("DD/MM/YYYY")
                          : "ไม่ระบุ"}
                      </p>
                      <p>
                        วันที่ชำระเงิน :{" "}
                        {order.transferDate
                          ? dayjs(order.transferDate).format("DD/MM/YYYY")
                          : "ไม่ระบุ"}
                      </p>
                      <p>
                        *** ทางร้านจะโอนค่ามัดจำคืนหลังจากลูกค้าคืนสินค้าสำเร็จ
                        จำนวน {order.totalDeposit} บาท กรณีสินค้าไม่เสียหาย***
                      </p>
                    </div>
                  </div>
                </div>

                {/* ส่วนล่างสุด: สถานะการคืนสินค้า และ วันที่คืนสินค้า */}
                {/* แสดงช่อง "อัปโหลดรูปชำระเงิน" เฉพาะเมื่อสถานะไม่ใช่ pay หรือ send */}
                {order.status !== "pay" && order.status !== "send" && (
                  <div className="card-footer">
                    <div className="d-flex align-items-center">
                      <label
                        htmlFor={`payment-upload-${order.id}`}
                        className="me-2"
                      >
                        อัปโหลดรูปชำระเงิน:
                      </label>
                      <input
                        id={`payment-upload-${order.id}`}
                        type="file"
                        onChange={handlePaymentFileChange}
                        accept="image/*"
                        className="form-control w-25 me-2"
                        disabled={uploadingPaymentId === order.id}
                      />
                      <button
                        className="btn btn-primary"
                        onClick={() => handlePaymentUpload(order.id)}
                        disabled={uploadingPaymentId === order.id}
                      >
                        {uploadingPaymentId === order.id
                          ? "Uploading..."
                          : "อัพโหลดรูปชำระเงิน"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="card-footer d-flex justify-content-between align-items-center">
                  <span>
                    วันที่ต้องคืนสินค้า :{" "}
                    {order.returnDate
                      ? dayjs(order.returnDate).format("DD/MM/YYYY") // รูปแบบ วัน/เดือน/ปี
                      : "ไม่ระบุ"}
                  </span>
                  <div className="d-flex align-items-center">
                    <span className="me-2">สถานะคืนสินค้า :</span>
                    {displayReturnStatus(order.returnStatus)}
                  </div>
                </div>
                {/* แสดงช่อง "อัปโหลดรูปคืนสินค้า" เฉพาะเมื่อสถานะไม่ใช่ Waitingtocheck หรือ approved */}
                {order.returnStatus !== "Waitingtocheck" &&
                  order.returnStatus !== "approved" &&
                  order.returnStatus !== "rejected" && (
                    <div className="card-footer">
                      <div className="d-flex align-items-center">
                        <label
                          htmlFor={`return-upload-${order.id}`}
                          className="me-2"
                        >
                          อัปโหลดรูปคืนสินค้า:
                        </label>
                        <input
                          id={`return-upload-${order.id}`}
                          type="file"
                          onChange={handleFileChange}
                          accept="image/*"
                          className="form-control w-25 me-2"
                          disabled={uploadingOrderId === order.id}
                        />
                        <button
                          className="btn btn-primary"
                          onClick={() => handleUpload(order.id)}
                          disabled={uploadingOrderId === order.id}
                        >
                          {uploadingOrderId === order.id
                            ? "Uploading..."
                            : "อัพโหลดรูปคืนสินค้า"}
                        </button>
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </>
        ) : (
          <div className="text-center p-5">
            <h5 className="text-muted">ไม่มีสินค้าในรายการเช่านี้</h5>
          </div>
        )}
      </div>
    </BackOffice>
  );
}

export default Orders;
