import BuildCreator from "@/components/BuildCreator";

const BuildCreate = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Create New Build</h1>
      <BuildCreator />
    </div>
  );
};

export default BuildCreate;
