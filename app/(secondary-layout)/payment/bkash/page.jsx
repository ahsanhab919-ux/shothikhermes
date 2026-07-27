import BkashPyament from "@/components/(secondary-layout)/(payment-page)/BkashPayment";

export async function generateMetadata() {
  return {
    title: "Payment With Bkash | Shothik AI",
    description: "This is Bkash payment page",
  };
}

const BkashPyamentPage = () => {
  return (
    <div className="container mx-auto min-h-screen px-4 pt-40 pb-40">
      <h1 className="text-center text-3xl font-bold">
        {`Let's finish powering you up!`}
      </h1>

      <p className="text-muted-foreground mb-20 text-center">
        Professional plan is right for you.
      </p>

      <div className="flex flex-col items-center justify-center">
        <BkashPyament />
      </div>
    </div>
  );
};

export default BkashPyamentPage;
