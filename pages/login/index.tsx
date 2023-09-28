import { useState } from "react"
import { Button, Image, Form, Input, Space, message } from 'antd';
import { setToken } from "~helpers/storage";
import { checkToken } from "~helpers/login";
import logo from "assets/img/octa.png";

type FieldType = {
    token?: string;
};

function Login() {
  const [data, setData] = useState("")
  const [messageApi, contextHolder] = message.useMessage();
  const containerStyle = {
    display: 'flex',
    justifyItems: "column",
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
  };

  const onFinish = async (value: any) => {
    if(await checkToken(value.token)){
        setToken(value.token)
        success()
        return
    }
    else{
        error()
        return
    }
  };
  const success = () => {
    messageApi.open({
      type: 'success',
      content: 'Signed In',
    });
  };
  const error = () => {
    messageApi.open({
      type: 'error',
      content: 'Invalid API Key',
    });
  };
  return (
    <>
    <div style={containerStyle}>
        {contextHolder}
            <Image width={50} src={logo} alt="OctaVPN" preview={false}></Image>
        
            <Form
                name="basic"
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 16 }}
                style={{ maxWidth: 250 }}
                onFinish={onFinish}
                autoComplete="off"
            >

                <Form.Item<FieldType>
                    label="API Key"
                    style={{
                        fontSize: "20px"
                    }}
                    name="token"
                    rules={[{ required: true, message: 'Please enter your API Key' }]}
                >
                    <Input.Password />
                </Form.Item>

                <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                    <Button type="primary" htmlType="submit" style={{ backgroundColor: "#8B68FF" }}>
                        Sign In
                    </Button>
                </Form.Item>
            </Form>
            </div>
          </>
  )
}

export default Login
