import {
  AcademicMessage,
  CreativeMessage,
  FormalMessage,
  Humanize,
  LongMessage,
  NewsMessage,
  ShortMessage,
  SimpleMessage,
} from "./UpdateModals";

const Components = {
  Humanize: Humanize,
  Formal: FormalMessage,
  Academic: AcademicMessage,
  Creative: CreativeMessage,
  News: NewsMessage,
  Simple: SimpleMessage,
  Short: ShortMessage,
  Long: LongMessage,
};

const UpdateComponent = ({ Component }) => {
  if (!Component) return null;
  const Compo = Components[Component];
  return <Compo />;
};

export default UpdateComponent;
